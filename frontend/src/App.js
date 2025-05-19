import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ScenarioForm from './components/ScenarioForm';
import ScenarioList from './components/ScenarioList';
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
                <Link to="/scenarios/new">Создать сценарий</Link>
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
