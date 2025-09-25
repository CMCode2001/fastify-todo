# E-commerce API

Une API e-commerce complète construite avec Node.js, Fastify, MySQL, Prisma, Redis et JWT.

## 🚀 Fonctionnalités

- **Authentification JWT** : Inscription, connexion, gestion des profils
- **Gestion des produits** : CRUD complet avec pagination, recherche et filtres
- **Base de données** : MySQL avec Prisma ORM
- **Cache** : Redis pour améliorer les performances
- **Sécurité** : Middleware de sécurité, validation des données, rate limiting
- **Documentation** : Swagger/OpenAPI complète
- **Logging** : Winston pour un logging structuré
- **Docker** : Containerisation complète avec Docker Compose
- **Architecture MVC** : Code organisé et maintenable

## 📋 Prérequis

- Node.js 18+
- Docker & Docker Compose
- Git

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd ecommerce-api
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration

Copier le fichier d'environnement :

```bash
cp .env.example .env
```

Modifier les variables dans `.env` selon vos besoins.

### 4. Démarrer les services avec Docker

```bash
# Développement (MySQL + Redis + phpMyAdmin)
docker-compose -f docker-compose.dev.yml up -d

# Ou production (avec l'application)
docker-compose up -d
```

### 5. Configurer la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Exécuter les migrations
npm run db:migrate

# Peupler la base de données (optionnel)
npm run db:seed
```

### 6. Démarrer l'application

```bash
# Développement
npm run dev

# Production
npm start
```

## 📚 Documentation API

Une fois l'application démarrée, la documentation Swagger est disponible à :

- **Swagger UI** : http://localhost:3000/docs

### Endpoints principaux

#### Authentification

- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `GET /api/v1/auth/profile` - Profil utilisateur
- `PUT /api/v1/auth/profile` - Modifier le profil
- `PUT /api/v1/auth/change-password` - Changer le mot de passe
- `POST /api/v1/auth/logout` - Déconnexion

#### Produits

- `GET /api/v1/products` - Liste des produits (public)
- `GET /api/v1/products/:id` - Détails d'un produit (public)
- `POST /api/v1/products` - Créer un produit (ADMIN)
- `PUT /api/v1/products/:id` - Modifier un produit (ADMIN)
- `DELETE /api/v1/products/:id` - Supprimer un produit (ADMIN)
- `GET /api/v1/products/stats/overview` - Statistiques (ADMIN)

#### Autres

- `GET /api/v1/health` - Santé de l'API

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. 

### Utilisation

1. **Inscription/Connexion** : Obtenez un token via `/auth/register` ou `/auth/login`
2. **Autorisation** : Incluez le token dans l'en-tête `Authorization: Bearer <token>`

### Comptes de test

Après avoir exécuté le seeding :

- **Admin** : admin@ecommerce.com / Admin123!
- **Utilisateur** : user@ecommerce.com / User123!

## 🗄️ Base de données

### Modèles

#### User

```sql
- id (UUID, PK)
- email (String, unique)
- password (String, hashed)
- name (String)
- role (Enum: USER, ADMIN)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Product

```sql
- id (UUID, PK)
- name (String)
- description (Text)
- price (Decimal)
- quantity (Integer)
- sku (String, unique)
- category (String)
- isActive (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
```

## 📦 Docker

### Services

- **app** : Application Node.js
- **mysql** : Base de données MySQL 8.0
- **redis** : Cache Redis 7
- **phpmyadmin** : Interface web MySQL (développement)

### Commandes utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Rebuild et restart
docker-compose up -d --build
```

## 🚦 Scripts NPM

```bash
npm start          # Démarrer en production
npm run dev        # Démarrer en développement avec nodemon
npm test           # Exécuter les tests
npm run db:migrate # Exécuter les migrations Prisma
npm run db:generate# Générer le client Prisma
npm run db:seed    # Peupler la base de données
npm run docker:up  # Démarrer Docker Compose
npm run docker:down# Arrêter Docker Compose
```

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion MySQL | - |
| `REDIS_URL` | URL de connexion Redis | - |
| `JWT_SECRET` | Secret pour JWT | - |
| `JWT_EXPIRES_IN` | Durée de vie du JWT | 7d |
| `PORT` | Port du serveur | 3000 |
| `NODE_ENV` | Environnement | development |
| `LOG_LEVEL` | Niveau de log | info |
| `CORS_ORIGIN` | Origines CORS autorisées | - |
| `RATE_LIMIT_MAX` | Limite de requêtes | 100 |
| `BCRYPT_ROUNDS` | Rounds bcrypt | 12 |

## 🏗️ Architecture

```
src/
├── config/          # Configuration de l'application
├── controllers/     # Logique métier
├── middleware/      # Middleware personnalisés
├── routes/          # Définition des routes
├── services/        # Services (database, redis, jwt, etc.)
├── validators/      # Schémas de validation Joi
├── seeds/           # Scripts de peuplement
├── utils/           # Utilitaires
└── server.js        # Point d'entrée principal
```

## 🧪 Tests

```bash
# Exécuter tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📊 Monitoring

### Logs

Les logs sont configurés avec Winston et incluent :
- Logs de requêtes HTTP
- Logs d'erreurs
- Logs de base de données
- Logs de cache Redis

### Santé de l'API

Endpoint : `GET /api/v1/health`

Retourne :
- Statut de l'API
- Uptime
- Version
- Environnement

## 🚀 Déploiement

### Production

1. Cloner le projet sur le serveur
2. Configurer les variables d'environnement
3. Construire l'image Docker : `docker-compose build`
4. Démarrer : `docker-compose up -d`
5. Exécuter les migrations : `docker-compose exec app npm run db:migrate`

### CI/CD

Le projet est prêt pour l'intégration avec :
- GitHub Actions
- GitLab CI
- Jenkins
- Docker Hub

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Email : support@ecommerce-api.com

## 🎯 Roadmap

- [ ] Tests unitaires et d'intégration
- [ ] Upload d'images pour les produits
- [ ] Système de commandes
- [ ] Gestion des stocks avancée
- [ ] API de paiement
- [ ] Notifications push
- [ ] Métriques et analytics
- [ ] API GraphQL alternative