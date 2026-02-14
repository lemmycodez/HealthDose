import React, { useState } from 'react';

// Sample medication data (hardcoded for testing)
const medications = [
  { id: '1', genericName: 'Ibuprofen', brandNames: ['Advil', 'Motrin'], drugClass: 'NSAID' },
  { id: '2', genericName: 'Acetaminophen', brandNames: ['Tylenol'], drugClass: 'Analgesic' },
  { id: '3', genericName: 'Warfarin', brandNames: ['Coumadin'], drugClass: 'Anticoagulant' },
  { id: '4', genericName: 'Amoxicillin', brandNames: ['Amoxil'], drugClass: 'Penicillin' },
  { id: '5', genericName: 'Lisinopril', brandNames: ['Prinivil', 'Zestril'], drugClass: 'ACE Inhibitor' },
  { id: '6', genericName: 'Metformin', brandNames: ['Glucophage'], drugClass: 'Biguanide' },
  { id: '7', genericName: 'Simvastatin', brandNames: ['Zocor'], drugClass: 'Statin' },
  { id: '8', genericName: 'Aspirin', brandNames: ['Bayer'], drugClass: 'NSAID' },
];

// Sample interactions
const interactions = [
  { 
    drugA: 'Ibuprofen', 
    drugB: 'Warfarin', 
    severity: 'severe',
    description: 'Increased risk of bleeding',
    advice: 'Avoid concurrent use'
  },
  { 
    drugA: 'Ibuprofen', 
    drugB: 'Aspirin', 
    severity: 'moderate',
    description: 'Increased GI side effects',
    advice: 'Use with caution'
  },
  { 
    drugA: 'Simvastatin', 
    drugB: 'Amoxicillin', 
    severity: 'mild',
    description: 'Reduced antibiotic efficacy',
    advice: 'Monitor closely'
  },
];

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [interactionResult, setInteractionResult] = useState<any>(null);

  // Search function
  const handleSearch = () => {
    if (searchTerm.length < 2) return;
    
    const results = medications.filter(med => 
      med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.brandNames.some(brand => brand.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setSearchResults(results);
  };

  // Check interaction
  const handleCheckInteraction = () => {
    const interaction = interactions.find(i => 
      (i.drugA.toLowerCase() === drugA.toLowerCase() && i.drugB.toLowerCase() === drugB.toLowerCase()) ||
      (i.drugA.toLowerCase() === drugB.toLowerCase() && i.drugB.toLowerCase() === drugA.toLowerCase())
    );
    
    if (interaction) {
      setInteractionResult(interaction);
    } else {
      setInteractionResult({ message: 'No interaction found', severity: 'none' });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>💊 HealthDose - Phase 2 Demo</h1>
      
      {/* Search Section */}
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>🔍 Medication Search</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Type drug name (e.g., ibu)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '10px', fontSize: '16px' }}
          />
          <button onClick={handleSearch} style={{ padding: '10px 20px' }}>
            Search
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div>
            <h3>Results ({searchResults.length})</h3>
            {searchResults.map(med => (
              <div key={med.id} style={{ padding: '10px', margin: '5px 0', background: '#f5f5f5', borderRadius: '4px' }}>
                <strong>{med.genericName}</strong>
                {med.brandNames.length > 0 && <span> ({med.brandNames.join(', ')})</span>}
                <div style={{ fontSize: '14px', color: '#666' }}>Class: {med.drugClass}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interaction Checker Section */}
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>⚠️ Drug Interaction Checker</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Drug A (e.g., Ibuprofen)" 
            value={drugA}
            onChange={(e) => setDrugA(e.target.value)}
            style={{ flex: 1, padding: '10px', fontSize: '16px' }}
          />
          <input 
            type="text" 
            placeholder="Drug B (e.g., Warfarin)" 
            value={drugB}
            onChange={(e) => setDrugB(e.target.value)}
            style={{ flex: 1, padding: '10px', fontSize: '16px' }}
          />
          <button onClick={handleCheckInteraction} style={{ padding: '10px 20px' }}>
            Check
          </button>
        </div>
        
        {interactionResult && (
          <div style={{ 
            padding: '15px', 
            borderRadius: '4px',
            background: interactionResult.severity === 'severe' ? '#ffebee' : 
                       interactionResult.severity === 'moderate' ? '#fff3e0' : 
                       interactionResult.severity === 'mild' ? '#e8f5e8' : '#f5f5f5'
          }}>
            {interactionResult.message ? (
              <p>{interactionResult.message}</p>
            ) : (
              <>
                <h3 style={{ margin: '0 0 10px 0' }}>
                  Severity: <span style={{ 
                    color: interactionResult.severity === 'severe' ? '#c62828' : 
                           interactionResult.severity === 'moderate' ? '#ef6c00' : '#2e7d32'
                  }}>{interactionResult.severity.toUpperCase()}</span>
                </h3>
                <p><strong>Description:</strong> {interactionResult.description}</p>
                <p><strong>Advice:</strong> {interactionResult.advice}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Test Buttons */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>Quick test:</p>
        <button onClick={() => { setSearchTerm('ibu'); handleSearch(); }} style={{ margin: '5px' }}>
          Test Search "ibu"
        </button>
        <button onClick={() => { setDrugA('Ibuprofen'); setDrugB('Warfarin'); handleCheckInteraction(); }} style={{ margin: '5px' }}>
          Test Ibuprofen + Warfarin
        </button>
      </div>
    </div>
  );
}