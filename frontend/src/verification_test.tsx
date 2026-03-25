import React from 'react';
import ReactDOM from 'react-dom/client';
import ExportPanel from './components/ExportPanel';
import PortalBrowser from './components/PortalBrowser';
import NotificationContainer from './components/Notification';
import SiteSuitabilityPanel from './components/SiteSuitabilityPanel';

const App = () => {
  const [showExport, setShowExport] = React.useState(true);
  const [showPortal, setShowPortal] = React.useState(true);
  const [showNotification, setShowNotification] = React.useState(true);
  const [showSuitability, setShowSuitability] = React.useState(true);

  return (
    <div style={{ padding: '20px' }}>
      <h1>ARIA Label Verification</h1>

      <div style={{ position: 'relative', height: '300px', border: '1px solid #ccc', margin: '20px 0' }}>
        <ExportPanel
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          mapBounds={{}}
          activeLayers={[]}
        />
      </div>

      <div style={{ position: 'relative', height: '300px', border: '1px solid #ccc', margin: '20px 0' }}>
        {showPortal && <PortalBrowser onClose={() => setShowPortal(false)} onAddToMap={() => {}} />}
      </div>

      <div style={{ position: 'relative', height: '100px', border: '1px solid #ccc', margin: '20px 0' }}>
        {showNotification && (
          <NotificationContainer
            notifications={[{ id: 1, message: 'Test notification', type: 'info', duration: 0 }]}
            onRemove={() => setShowNotification(false)}
          />
        )}
      </div>

      <div style={{ position: 'relative', height: '300px', border: '1px solid #ccc', margin: '20px 0' }}>
         <SiteSuitabilityPanel
            isOpen={showSuitability}
            onClose={() => setShowSuitability(false)}
            selectedLocation={null}
            onLocationSelect={() => {}}
            onExport={() => {}}
         />
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
