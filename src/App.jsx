import { useState, useEffect } from 'react';
import { loadConfig, DEFAULT_CONFIG } from './utils/storage';
import LandingPage from './pages/LandingPage';
import ParentDashboard from './pages/ParentDashboard';
import KidSelect from './pages/KidSelect';
import KidChat from './pages/KidChat';
import Setup from './pages/Setup';

export default function App() {
  const [config, setConfig] = useState(null);
  const [route, setRoute] = useState('landing'); // landing | setup | parent | kid-select | kid-chat
  const [selectedKid, setSelectedKid] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    const cfg = loadConfig();
    if (cfg) {
      setConfig(cfg);
    }
  }, []);

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
  };

  if (route === 'landing') {
    return <LandingPage config={config} onParent={() => setRoute(config ? 'parent' : 'setup')} onKid={() => setRoute('kid-select')} />;
  }

  if (route === 'setup') {
    return <Setup onComplete={(cfg) => { handleConfigSave(cfg); setRoute('parent'); }} />;
  }

  if (route === 'parent') {
    return <ParentDashboard config={config} onSave={handleConfigSave} onBack={() => setRoute('landing')} />;
  }

  if (route === 'kid-select') {
    return <KidSelect config={config} onSelect={(kid, agent) => { setSelectedKid(kid); setSelectedAgent(agent); setRoute('kid-chat'); }} onBack={() => setRoute('landing')} />;
  }

  if (route === 'kid-chat') {
    return <KidChat config={config} kid={selectedKid} agent={selectedAgent} onBack={() => setRoute('kid-select')} />;
  }

  return null;
}
