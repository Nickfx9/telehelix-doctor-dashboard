import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false); // toggle between login & register

  return (
    <>
      {!user ? (
        showRegister ? (
          <Register
            onRegister={(doctor) => setUser(doctor)}
            switchToLogin={() => setShowRegister(false)}
          />
        ) : (
          <Login
            onLogin={(doctor) => setUser(doctor)}
            switchToRegister={() => setShowRegister(true)}
          />
        )
      ) : (
        <Dashboard doctor={user} />
      )}
    </>
  );
}

export default App;
