import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./components/growshop/HomePage";
import ShopApp from "./components/growshop/ShopApp";
import RegisterPage from "./components/growshop/RegisterPage";
import ContactPage from "./components/growshop/ContactPage";

const App = () => {
  return (
    <Router>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        {/* Main Application Routes */}
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<HomePage />} />

          {/* Shop Section */}
          <Route path="/shop" element={<ShopApp />} />

          {/* Registration */}
          <Route path="/registro" element={<RegisterPage />} />

          {/* Contact */}
          <Route path="/contacto" element={<ContactPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
