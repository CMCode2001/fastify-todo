const { getDatabaseService } = require('../services/database');
const RedisService = require('../services/redis');
const { createLogger } = require('../services/logger');

const logger = createLogger('ProductController');

class ProductController {
  constructor(fastify) {
    this.db = getDatabaseService().getPrisma();
    this.redis = new RedisService(fastify);
  }
  
  /**
   * Créer un nouveau produit
   */
  async createProduct(request, reply) {
    try {
      const productData = request.body;
      const userId = request.user.id;
      
      logger.info('Création d\'un produit', { userId, sku: productData.sku });
      
      // Vérifier si le SKU existe déjà
      const existingProduct = await this.db.product.findUnique({
        where: { sku: productData.sku }
      });
      
      if (existingProduct) {
        logger.warn('Tentative de création avec SKU existant', { sku: productData.sku });
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Un produit avec ce SKU existe déjà'
        });
      }
      
      // Créer le produit
      const product = await this.db.product.create({
        data: productData
      });
      
      // Invalider le cache des produits
      await this.redis.del('products:*');
      
      logger.info('Produit créé', { productId: product.id, sku: product.sku });
      
      return reply.code(201).send({
        message: 'Produit créé avec succès',
        product
      });
      
    } catch (error) {
      logger.error('Erreur lors de la création du produit', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Récupérer tous les produits avec pagination et filtres
   */
  async getProducts(request, reply) {
    try {
      const {
        page,
        limit,
        search,
        category,
        isActive,
        sortBy,
        sortOrder
      } = request.query;
      
      logger.debug('Récupération des produits', { page, limit, search, category, isActive });
      
      // Créer la clé de cache
      const cacheKey = `products:${JSON.stringify(request.query)}`;
      
      // Essayer de récupérer depuis le cache
      let cachedResult = await this.redis.get(cacheKey);
      if (cachedResult) {
        logger.debug('Produits récupérés depuis le cache');
        return reply.send(cachedResult);
      }
      
      // Construire les conditions de recherche
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (category) {
        where.category = { contains: category, mode: 'insensitive' };
      }
      
      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }
      
      // Configuration de la pagination
      const skip = (page - 1) * limit;
      
      // Configuration du tri
      const orderBy = {};
      orderBy[sortBy] = sortOrder;
      
      // Exécuter les requêtes en parallèle
      const [products, totalCount] = await Promise.all([
        this.db.product.findMany({
          where,
          skip,
          take: limit,
          orderBy
        }),
        this.db.product.count({ where })
      ]);
      
      // Calculer les métadonnées de pagination
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      const result = {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      };
      
      // Mettre en cache le résultat pour 5 minutes
      await this.redis.set(cacheKey, result, 300);
      
      logger.debug('Produits récupérés', { count: products.length, totalCount });
      
      return reply.send(result);
      
    } catch (error) {
      logger.error('Erreur lors de la récupération des produits', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Récupérer un produit par son ID
   */
  async getProductById(request, reply) {
    try {
      const { id } = request.params;
      
      logger.debug('Récupération d\'un produit', { productId: id });
      
      // Essayer de récupérer depuis le cache
      const cacheKey = `product:${id}`;
      let product = await this.redis.get(cacheKey);
      
      if (!product) {
        // Si pas en cache, récupérer depuis la base
        product = await this.db.product.findUnique({
          where: { id }
        });
        
        if (!product) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Produit non trouvé'
          });
        }
        
        // Mettre en cache pour 10 minutes
        await this.redis.set(cacheKey, product, 600);
      }
      
      logger.debug('Produit récupéré', { productId: id });
      
      return reply.send({
        product
      });
      
    } catch (error) {
      logger.error('Erreur lors de la récupération du produit', { error: error.message, productId: request.params.id });
      throw error;
    }
  }
  
  /**
   * Mettre à jour un produit
   */
  async updateProduct(request, reply) {
    try {
      const { id } = request.params;
      const updateData = request.body;
      const userId = request.user.id;
      
      logger.info('Mise à jour d\'un produit', { productId: id, userId });
      
      // Vérifier si le produit existe
      const existingProduct = await this.db.product.findUnique({
        where: { id }
      });
      
      if (!existingProduct) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Produit non trouvé'
        });
      }
      
      // Vérifier si le nouveau SKU existe déjà (si modifié)
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const duplicateSku = await this.db.product.findFirst({
          where: {
            sku: updateData.sku,
            NOT: { id }
          }
        });
        
        if (duplicateSku) {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'Un produit avec ce SKU existe déjà'
          });
        }
      }
      
      // Mettre à jour le produit
      const product = await this.db.product.update({
        where: { id },
        data: updateData
      });
      
      // Invalider les caches
      await Promise.all([
        this.redis.del(`product:${id}`),
        this.redis.del('products:*')
      ]);
      
      logger.info('Produit mis à jour', { productId: id });
      
      return reply.send({
        message: 'Produit mis à jour avec succès',
        product
      });
      
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du produit', { error: error.message, productId: request.params.id });
      throw error;
    }
  }
  
  /**
   * Supprimer un produit
   */
  async deleteProduct(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      
      logger.info('Suppression d\'un produit', { productId: id, userId });
      
      // Vérifier si le produit existe
      const existingProduct = await this.db.product.findUnique({
        where: { id }
      });
      
      if (!existingProduct) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Produit non trouvé'
        });
      }
      
      // Supprimer le produit
      await this.db.product.delete({
        where: { id }
      });
      
      // Supprimer du cache
      await Promise.all([
        this.redis.del(`product:${id}`),
        this.redis.del('products:*')
      ]);
      
      logger.info('Produit supprimé', { productId: id });
      
      return reply.send({
        message: 'Produit supprimé avec succès'
      });
      
    } catch (error) {
      logger.error('Erreur lors de la suppression du produit', { error: error.message, productId: request.params.id });
      throw error;
    }
  }
  
  /**
   * Récupérer les statistiques des produits
   */
  async getProductStats(request, reply) {
    try {
      const userId = request.user.id;
      
      logger.debug('Récupération des statistiques produits', { userId });
      
      // Essayer de récupérer depuis le cache
      const cacheKey = 'product:stats';
      let stats = await this.redis.get(cacheKey);
      
      if (!stats) {
        // Calculer les statistiques
        const [
          totalProducts,
          activeProducts,
          inactiveProducts,
          totalValue,
          categories,
          lowStock
        ] = await Promise.all([
          this.db.product.count(),
          this.db.product.count({ where: { isActive: true } }),
          this.db.product.count({ where: { isActive: false } }),
          this.db.product.aggregate({
            _sum: { price: true }
          }),
          this.db.product.groupBy({
            by: ['category'],
            _count: { category: true }
          }),
          this.db.product.count({
            where: {
              quantity: { lt: 10 },
              isActive: true
            }
          })
        ]);
        
        stats = {
          totalProducts,
          activeProducts,
          inactiveProducts,
          totalValue: totalValue._sum.price || 0,
          categoriesCount: categories.length,
          categories: categories.map(cat => ({
            name: cat.category,
            count: cat._count.category
          })),
          lowStockProducts: lowStock
        };
        
        // Mettre en cache pour 15 minutes
        await this.redis.set(cacheKey, stats, 900);
      }
      
      logger.debug('Statistiques récupérées');
      
      return reply.send({
        stats
      });
      
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques', { error: error.message });
      throw error;
    }
  }
}

module.exports = ProductController;