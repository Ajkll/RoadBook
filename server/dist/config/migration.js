"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
// Charge les variables d'environnement
dotenv_1.default.config();
// Fonction pour exécuter une migration
const runMigration = async (environment) => {
    try {
        // Détermine l'URL de la base de données en fonction de l'environnement
        const dbUrl = environment === "test"
            ? process.env.TEST_DATABASE_URL
            : process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error(`L'URL de la base de données pour ${environment} n'est pas définie`);
        }
        // Exécute la commande de migration Prisma
        (0, child_process_1.execSync)(`DATABASE_URL=${dbUrl} npx prisma migrate dev --name init`, {
            stdio: "inherit",
        });
        console.log(`Migration pour l'environnement ${environment} terminée avec succès`);
    }
    catch (error) {
        console.error(`Erreur lors de la migration pour l'environnement ${environment}:`, error);
        process.exit(1);
    }
};
// Fonction principale qui exécute les migrations pour les environnements spécifiés
const main = async () => {
    const args = process.argv.slice(2);
    const environments = args.length > 0 ? args : ["dev", "test"];
    for (const env of environments) {
        if (env === "dev" || env === "test") {
            console.log(`Exécution de la migration pour l'environnement ${env}...`);
            await runMigration(env);
        }
        else {
            console.warn(`Environnement inconnu: ${env}. Utilisation de: dev, test`);
        }
    }
};
// Exécute la fonction principale
main().catch(console.error);
