import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function TestSentryManual() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Générer un UUID au format attendu par Sentry
  const generateEventId = () => {
    // Génère un UUID v4 (32 caractères hexadécimaux sans tirets)
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
      return (Math.random() * 16 | 0).toString(16);
    });
  };

  // Tester directement l'API REST de Sentry - le plus simple
  const testSentryRestApi = async () => {
    try {
      addLog(" Test de l'API REST Sentry...");

      // La clé DSN complète
      const DSN = "https://8339fba1e23bfdc0476b764825ad3dc1@o4509277166632961.ingest.de.sentry.io/4509277987340368";

      // Extraire les parties de la DSN
      const matches = DSN.match(/^https:\/\/([^@]+)@([^\/]+)\/(.+)$/);

      if (!matches || matches.length < 4) {
        addLog("Format DSN invalide");
        return;
      }

      const [_, publicKey, host, projectId] = matches;

      addLog(` DSN info - Public Key: ${publicKey}`);
      addLog(` DSN info - Host: ${host}`);
      addLog(`DSN info - Project ID: ${projectId}`);

      // Créer un événement Sentry au format correct
      const eventId = generateEventId();
      addLog(` Envoi de l'événement ID: ${eventId}`);

      const event = {
        event_id: eventId,
        timestamp: new Date().toISOString().split('.')[0],
        platform: Platform.OS,
        level: "info",
        logger: "javascript",
        environment: "development",
        message: {
          message: `Test direct API à ${new Date().toISOString()}`
        },
        tags: {
          test_type: "manual_api_test"
        },
        extra: {
          direct_test: true
        }
      };

      // Construire l'URL de l'API Sentry
      const url = `https://${host}/api/${projectId}/store/`;

      // Envoyer l'événement
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=test-app/1.0`
        },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        addLog(` Événement envoyé avec succès! Status: ${response.status}`);
      } else {
        const errorText = await response.text();
        addLog(` Échec de l'envoi - Status: ${response.status}`);
        addLog(` Réponse: ${errorText}`);
      }
    } catch (error) {
      addLog(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Tester l'API d'authentification (pour vérifier le token)
  const testSentryAuthApi = async () => {
    try {
      addLog("Test de l'API d'authentification Sentry...");

      const authToken = "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";

      // Tester avec l'API des projets
      const response = await fetch("https://sentry.io/api/0/projects/", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        addLog(` API Auth OK - Status: ${response.status}`);
        addLog(` Projets trouvés: ${data.length}`);

        // Afficher les noms des projets
        data.forEach((project: any) => {
          addLog(` Projet: ${project.name} (${project.slug})`);
        });

        if (data.length === 0) {
          addLog(` Aucun projet trouvé. Vérifiez les permissions du token.`);
        }
      } else {
        const errorText = await response.text();
        addLog(` Échec Auth - Status: ${response.status}`);
        addLog(` Réponse: ${errorText}`);
      }
    } catch (error) {
      addLog(` Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Tester la connectivité réseau de base
  const testNetworkConnectivity = async () => {
    try {
      addLog(" Test de connectivité réseau...");

      // Tester la connexion à Google (fiable)
      const response = await fetch("https://www.google.com");

      if (response.ok) {
        addLog(` Connectivité OK: ${response.status}`);
      } else {
        addLog(` Réponse non-OK: ${response.status}`);
      }

      // Tester la connexion à Sentry
      const sentryResponse = await fetch("https://sentry.io");

      if (sentryResponse.ok) {
        addLog(` Sentry connectivité OK: ${sentryResponse.status}`);
      } else {
        addLog(` Sentry réponse non-OK: ${sentryResponse.status}`);
      }
    } catch (error) {
      addLog(` Erreur réseau: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Test Manuel Sentry' }} />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Test Manuel API Sentry</Text>
        <Text style={styles.infoText}>Contourne la bibliothèque sentry-expo et teste directement les API</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={testSentryRestApi}>
          <Text style={styles.buttonText}>Test Direct API Sentry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testSentryAuthApi}>
          <Text style={styles.buttonText}>Test Auth Token Sentry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testNetworkConnectivity}>
          <Text style={styles.buttonText}>Test Connectivité</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  buttonsContainer: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  logsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  logText: {
    fontSize: 13,
    marginBottom: 6,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});