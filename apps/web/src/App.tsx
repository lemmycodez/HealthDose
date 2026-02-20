import React from 'react'

function App(): JSX.Element {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f4f6f8',
      }}
    >
      <h1 style={{ color: '#2c3e50' }}>HealthDose</h1>
      <p style={{ color: '#555', fontSize: '18px' }}>Welcome to your health management platform.</p>
      <button
        onClick={() => alert('Stay healthy!')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#3498db',
          color: 'white',
        }}
      >
        Get Started
      </button>
    </div>
  )
}

export default App
