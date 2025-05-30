/**
 * Script de test de connexion à la base de données
 * Utilisez ce script pour vérifier que votre connexion à Supabase fonctionne
 */

const { PrismaClient } = require('@prisma/client');

// Si vous avez des caractères spéciaux dans le mot de passe,
// vous devrez peut-être les encoder dans l'URL
const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://postgres.rwnalymtcliqtynsigsd:Laurice26%26%26@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";

// Imprimer l'URL (masquée) pour vérification
console.log('Tentative de connexion à la BD avec URL:',
  DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:***@'));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function testConnection() {
  try {
    // Tentative de connexion
    console.log('Connexion à la base de données...');
    await prisma.$connect();
    console.log('✅ Connexion réussie à la base de données!');
    
    // Tester une requête simple
    console.log('Test d\'une requête simple...');
    const usersCount = await prisma.user.count();
    console.log(`✅ Requête réussie: ${usersCount} utilisateurs dans la base de données`);
    
    return { success: true, message: 'Connexion à la base de données réussie', usersCount };
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return { 
      success: false, 
      message: 'Erreur de connexion à la base de données', 
      error: error.toString() 
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testConnection()
  .then(result => {
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });