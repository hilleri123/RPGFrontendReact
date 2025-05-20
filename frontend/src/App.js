import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ScenarioForm from './components/ScenarioForm';
import ScenarioList from './components/ScenarioList';
import RuleForm from './components/RuleForm';
import RuleList from './components/RuleList';
import RuleSelector from './components/RuleSelector';
import RuleDetails from './components/RuleDetails';
import ScenarioSelector from './components/ScenarioSelector';
import ScenarioDetails from './components/ScenarioDetails';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>RPG Scenario Manager</h1>
          <nav>
            <ul>
              <li>
                <Link to="/">Главная</Link>
              </li>
              <li>
                <Link to="/scenarios">Сценарии</Link>
              </li>
              <li>
                <Link to="/rules">Правила</Link>
              </li>
            </ul>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<div className="welcome">Добро пожаловать в менеджер сценариев для ролевых игр!</div>} />
            <Route path="/scenarios" element={<ScenarioList />} />
            <Route path="/scenarios/new" element={<ScenarioForm />} />
            <Route path="/scenarios/edit/:id" element={<ScenarioForm />} />
            <Route path="/scenarios/:scenarioId/details" element={<ScenarioDetails />} />
            <Route path="/rules" element={<RuleSelector />} />
            <Route path="/rules/new" element={<RuleForm />} />
            <Route path="/rules/edit/:id" element={<RuleForm />} />
            <Route path="/rules/:ruleId/details" element={<RuleDetails />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} RPG Scenario Manager</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
