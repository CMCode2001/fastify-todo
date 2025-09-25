# E-commerce API - Guide de démarrage rapide

## Installation et démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer les services Docker

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Configurer la base de données

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Démarrer l'application

```bash
npm run dev
```

## URLs importantes

- **API** : <http://localhost:3000>
- **Documentation** : <http://localhost:3000/docs>
- **phpMyAdmin** : <http://localhost:8080>
- **Health Check** : <http://localhost:3000/api/v1/health>

## Comptes de test

- **Admin** : `admin@ecommerce.com` / `Admin123!`
- **User** : `user@ecommerce.com` / `User123!`

## Tests rapides avec curl

### Inscription

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

### Connexion

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecommerce.com",
    "password": "Admin123!"
  }'
```

### Récupérer les produits

```bash
curl http://localhost:3000/api/v1/products
```

### Créer un produit (avec token admin)

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Nouveau Produit",
    "description": "Description du produit",
    "price": 99.99,
    "quantity": 10,
    "sku": "NOUVEAU-PRODUIT-001",
    "category": "Test"
  }'
```

## Structure du projet

```text
ecommerce-api/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Logique métier
│   ├── middleware/      # Middleware
│   ├── routes/          # Routes API
│   ├── services/        # Services
│   ├── validators/      # Validation
│   ├── seeds/           # Données initiales
│   └── server.js        # Point d'entrée
├── prisma/
│   └── schema.prisma    # Schéma de base
├── docker-compose.yml   # Production
├── docker-compose.dev.yml # Développement
└── package.json
```

## Prochaines étapes

1. Explorez la documentation Swagger à <http://localhost:3000/docs>
2. Testez les endpoints avec Postman ou votre client HTTP préféré
3. Consultez les logs de l'application pour comprendre le fonctionnement
4. Modifiez les modèles Prisma selon vos besoins
5. Ajoutez de nouvelles fonctionnalités selon votre projet