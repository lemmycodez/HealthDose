import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

// Import your feature modules
import { searchMedications, getMedicationById } from './searchMedications';
import { checkInteraction, getMedicationInteractions } from './interactionChecker';
import { ragQuery } from './ragQuery';

// Initialize Firebase Admin
admin.initializeApp();

// CORS middleware
const corsHandler = cors({ origin: true });


// ===========================================
// HEALTH CHECK
// ===========================================

export const healthCheck = functions.https.onRequest(
  (req, res) => {
    corsHandler(req, res, () => {
      res.json({
        status: 'ok',
        time: new Date().toISOString(),
        endpoints: [
          'GET /healthCheck',
          'GET /searchMeds?q=ibu',
          'GET /getMedication?id=123',
          'POST /checkDrugInteraction',
          'GET /drugInteractions?drug=Ibuprofen',
          'POST /askHealthDose'
        ]
      });
    });
  }
);


// ===========================================
// SEARCH ENDPOINTS (Phase 2)
// ===========================================

export const searchMeds = functions.https.onRequest(
  async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      try {
        const searchTerm = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!searchTerm) {
          res.status(400).json({ error: 'Search term required (use ?q=ibu)' });
          return;
        }

        if (searchTerm.length < 2) {
          res.json({
            searchTerm,
            count: 0,
            results: [],
            message: 'Type at least 2 characters'
          });
          return;
        }

        const results = await searchMedications(searchTerm, limit);
        res.json(results);

      } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
      }
    });
  }
);


export const getMedication = functions.https.onRequest(
  async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      try {
        const id = req.query.id as string;

        if (!id) {
          res.status(400).json({ error: 'Medication ID required' });
          return;
        }

        const medication = await getMedicationById(id);

        if (!medication) {
          res.status(404).json({ error: 'Medication not found' });
          return;
        }

        res.json(medication);

      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to get medication' });
      }
    });
  }
);


// ===========================================
// INTERACTION ENDPOINTS (Phase 2)
// ===========================================

export const checkDrugInteraction = functions.https.onRequest(
  async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          res.status(405).json({ error: 'Use POST method' });
          return;
        }

        const { drugA, drugB } = req.body;

        if (!drugA || !drugB) {
          res.status(400).json({
            error: 'Both drugA and drugB required',
            example: { drugA: "Ibuprofen", drugB: "Warfarin" }
          });
          return;
        }

        const result = await checkInteraction(drugA, drugB);
        res.json(result);

      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Check failed' });
      }
    });
  }
);


export const drugInteractions = functions.https.onRequest(
  async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      try {
        const drug = req.query.drug as string;

        if (!drug) {
          res.status(400).json({ error: 'drug parameter required' });
          return;
        }

        const result = await getMedicationInteractions(drug);
        res.json(result);

      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to get interactions' });
      }
    });
  }
);


// ===========================================
// RAG CHAT ENDPOINT (Phase 3)
// ===========================================

export const askHealthDose = functions.https.onRequest(
  async (req: Request, res: Response) => {

    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    res.set('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.'
      });
      return;
    }

    try {
      const { question } = req.body;

      if (!question) {
        res.status(400).json({
          success: false,
          error: 'Question is required'
        });
        return;
      }

      console.log(`Question received: "${question}"`);

      const result = await ragQuery(question);
      result.timestamp = new Date().toISOString();

      console.log(`Response sent (${result.sources?.length || 0} sources)`);

      res.json(result);

    } catch (error) {
      console.error('Error in askHealthDose:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        answer: 'Sorry, I encountered an error processing your question.',
        sources: []
      });
    }
  }
);


// ===========================================
// TEST RAG ENDPOINT
// ===========================================

export const testRag = functions.https.onRequest(
  async (req: Request, res: Response) => {
    res.set('Access-Control-Allow-Origin', '*');

    try {
      const testQuestion =
        (req.query.q as string) ||
        "What are the side effects of ibuprofen?";

      console.log(`Test RAG with: "${testQuestion}"`);

      const result = await ragQuery(testQuestion);

      res.json({
        success: true,
        message: "RAG test complete",
        question: testQuestion,
        result
      });

    } catch (error) {
      console.error('Test RAG error:', error);
      res.status(500).json({
        success: false,
        error: String(error)
      });
    }
  }
);