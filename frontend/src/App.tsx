import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./components/growshop/HomePage";
import ShopApp from "./components/growshop/ShopApp";
import RegisterPage from "./components/growshop/RegisterPage";
import LoginPage from "./components/growshop/LoginPage";
import AdminPanel from "./components/growshop/AdminPanel";
import ContactPage from "./components/growshop/ContactPage";
import ProductDetailPage from "./components/growshop/ProductDetailPage";
import ScrollToTop from "./components/common/ScrollToTop";

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <div style={{ position: "relative", minHeight: "100vh" }}>
        {/* Main Application Routes */}
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<HomePage />} />

          {/* Shop Section */}
          <Route path="/shop" element={<ShopApp />} />

          {/* Registration */}
          <Route path="/registro" element={<RegisterPage />} />

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Panel */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Contact */}
          <Route path="/contacto" element={<ContactPage />} />

          {/* Product Detail */}
          <Route path="/producto/:id" element={<ProductDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
