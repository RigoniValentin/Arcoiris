import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./navigation/Navbar";
import Footer from "./layout/Footer";
import { productService } from "../../services/productService";
import { Product } from "../../types/shop";
import { handleProductConsult } from "../../utils/whatsappUtils";
import styles from "./ProductDetailPage.module.css";

// Cart types (mirror ShopSection)
interface CartItem {
  product: Product;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isContactingExpert, setIsContactingExpert] = useState(false);
  const [showAddedNotification, setShowAddedNotification] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Fetch product
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el producto"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Fetch related products once product is loaded
  useEffect(() => {
    if (!product?.categoryId) return;
    const fetchRelated = async () => {
      try {
        const all = await productService.getProductsByCategory(
          product.categoryId
        );
        const filtered = all
          .filter((p) => (p._id || p.id) !== (product._id || product.id))
          .slice(0, 4);
        setRelatedProducts(filtered);
      } catch {
        // silently fail
      }
    };
    fetchRelated();
  }, [product]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (
      !img.src.includes("default-product.png") &&
      !img.src.includes("vite.svg")
    ) {
      img.src = "/vite.svg";
    }
  };

  const addToCart = useCallback(
    (prod: Product, qty: number) => {
      const savedCart = localStorage.getItem("arcoiris-shop-cart");
      let cart: Cart = savedCart
        ? JSON.parse(savedCart)
        : { items: [], total: 0, itemCount: 0 };

      const productId = prod._id || prod.id;
      const existingIdx = cart.items.findIndex(
        (item) => (item.product._id || item.product.id) === productId
      );

      if (existingIdx >= 0) {
        cart.items[existingIdx].quantity += qty;
      } else {
        cart.items.push({ product: prod, quantity: qty });
      }

      cart.total = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      localStorage.setItem("arcoiris-shop-cart", JSON.stringify(cart));
    },
    []
  );

  const handleAddToCart = () => {
    if (!product) return;
    setIsAddingToCart(true);
    setTimeout(() => {
      addToCart(product, quantity);
      setIsAddingToCart(false);
      setShowAddedNotification(true);
      setTimeout(() => setShowAddedNotification(false), 3000);
    }, 800);
  };

  const handleConsult = () => {
    if (!product) return;
    setIsContactingExpert(true);
    handleProductConsult(product);
    setTimeout(() => setIsContactingExpert(false), 1000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = product
      ? `${product.name} - ${formatPrice(product.price)} | Arcoiris Joyería`
      : "Arcoiris Joyería";
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, text, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  // Gallery keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!product) return;
      const galleryLen = product.gallery?.length ?? 0;
      if (e.key === "ArrowLeft" && currentImageIndex > 0) {
        setCurrentImageIndex((i) => i - 1);
      } else if (
        e.key === "ArrowRight" &&
        currentImageIndex < galleryLen - 1
      ) {
        setCurrentImageIndex((i) => i + 1);
      } else if (e.key === "Escape" && imageZoomed) {
        setImageZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [product, currentImageIndex, imageZoomed]);

  // ─── Loading State ────────────────────────────
  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Cargando producto...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Error State ──────────────────────────────
  if (error || !product) {
    return (
      <div className={styles.pageWrapper}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>💎</div>
            <h2 className={styles.errorTitle}>Producto no encontrado</h2>
            <p className={styles.errorMessage}>
              {error || "No pudimos encontrar el producto que buscás."}
            </p>
            <Link to="/shop" className={styles.backToShopBtn}>
              ← Volver a la Tienda
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const galleryImages = product.gallery?.length
    ? product.gallery
    : product.image
      ? [product.image]
      : [];
  const currentImage = galleryImages[currentImageIndex] || product.image;

  return (
    <div className={styles.pageWrapper}>
      <Navbar />

      <main className={styles.main}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink}>
            Inicio
          </Link>
          <span className={styles.breadcrumbSeparator}>›</span>
          <Link to="/shop" className={styles.breadcrumbLink}>
            Tienda
          </Link>
          <span className={styles.breadcrumbSeparator}>›</span>
          {product.category && (
            <>
              <span className={styles.breadcrumbLink}>
                {product.category}
              </span>
              <span className={styles.breadcrumbSeparator}>›</span>
            </>
          )}
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* Product Detail */}
        <motion.section
          className={styles.productSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ── LEFT: Gallery ─────────────── */}
          <div className={styles.galleryColumn}>
            <div className={styles.mainImageWrapper}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={currentImage}
                  alt={product.name}
                  className={styles.mainImage}
                  onClick={() => setImageZoomed(true)}
                  onError={handleImageError}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </AnimatePresence>

              {/* Badges */}
              {product.featured && (
                <span className={styles.featuredBadge}>⭐ Destacado</span>
              )}
              {product.discount && (
                <span className={styles.discountBadge}>
                  -{product.discount}%
                </span>
              )}

              {/* Gallery Nav Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    className={`${styles.galleryArrow} ${styles.galleryArrowLeft}`}
                    onClick={() =>
                      setCurrentImageIndex((i) => Math.max(0, i - 1))
                    }
                    disabled={currentImageIndex === 0}
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    className={`${styles.galleryArrow} ${styles.galleryArrowRight}`}
                    onClick={() =>
                      setCurrentImageIndex((i) =>
                        Math.min(galleryImages.length - 1, i + 1)
                      )
                    }
                    disabled={currentImageIndex === galleryImages.length - 1}
                    aria-label="Imagen siguiente"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className={styles.thumbnailRow}>
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    className={`${styles.thumbnail} ${idx === currentImageIndex ? styles.thumbnailActive : ""}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info ───────────────── */}
          <div className={styles.infoColumn}>
            {/* Category + Name */}
            <div className={styles.headerBlock}>
              <span className={styles.categoryLabel}>{product.category}</span>
              <h1 className={styles.productName}>{product.name}</h1>

              {/* Rating */}
              {product.rating > 0 && (
                <div className={styles.ratingRow}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < Math.floor(product.rating)
                            ? styles.starFilled
                            : styles.star
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className={styles.ratingText}>
                    {product.rating} ({product.reviews} reseñas)
                  </span>
                </div>
              )}
            </div>

            {/* Price block */}
            <div className={styles.priceBlock}>
              <div className={styles.priceRow}>
                {product.originalPrice && (
                  <span className={styles.originalPrice}>
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <span className={styles.currentPrice}>
                  {formatPrice(product.price)}
                </span>
                {product.discount && (
                  <span className={styles.saveBadge}>
                    Ahorrás{" "}
                    {formatPrice(
                      (product.originalPrice || product.price) -
                        product.price
                    )}
                  </span>
                )}
              </div>
              <div className={styles.stockRow}>
                <span
                  className={`${styles.stockIndicator} ${product.inStock ? styles.inStock : styles.outOfStock}`}
                >
                  {product.inStock
                    ? `✓ En stock (${product.stockCount} disponibles)`
                    : "✗ Sin stock"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className={styles.descriptionBlock}>
              <h3 className={styles.sectionTitle}>Descripción</h3>
              <p className={styles.descriptionText}>{product.description}</p>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className={styles.tagsRow}>
                {product.tags.map((tag, i) => (
                  <span key={i} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Specifications */}
            {Object.keys(product.specifications || {}).length > 0 && (
              <div className={styles.specificationsBlock}>
                <h3 className={styles.sectionTitle}>
                  Especificaciones Técnicas
                </h3>
                <div className={styles.specsList}>
                  {Object.entries(product.specifications || {}).map(
                    ([key, value]) => (
                      <div key={key} className={styles.specItem}>
                        <span className={styles.specKey}>{key}</span>
                        <span className={styles.specValue}>{value}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Quantity + Actions */}
            <div className={styles.actionsBlock}>
              <div className={styles.quantityRow}>
                <label className={styles.quantityLabel}>Cantidad:</label>
                <div className={styles.quantitySelector}>
                  <button
                    className={styles.quantityBtn}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className={styles.quantityDisplay}>{quantity}</span>
                  <button
                    className={styles.quantityBtn}
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stockCount, q + 1)
                      )
                    }
                    disabled={quantity >= product.stockCount}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.buttonsRow}>
                <button
                  className={`${styles.addToCartBtn} ${isAddingToCart ? styles.btnLoading : ""}`}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !product.inStock}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>
                    {isAddingToCart
                      ? "Agregando..."
                      : `Agregar ${quantity > 1 ? `(${quantity})` : ""} al carrito`}
                  </span>
                </button>

                <button
                  className={`${styles.consultBtn} ${isContactingExpert ? styles.btnLoading : ""}`}
                  onClick={handleConsult}
                  disabled={isContactingExpert}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>
                    {isContactingExpert
                      ? "Abriendo..."
                      : "Consultar por WhatsApp"}
                  </span>
                </button>

                <button
                  className={styles.shareBtn}
                  onClick={handleShare}
                  title="Compartir producto"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Garantías */}
            <div className={styles.guaranteesRow}>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>🛡️</span>
                <span>Garantía de autenticidad</span>
              </div>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>📦</span>
                <span>Envío seguro</span>
              </div>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>💳</span>
                <span>Pagos flexibles</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Related Products ─────────── */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>Productos Relacionados</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((rp) => (
                <Link
                  key={rp._id || rp.id}
                  to={`/producto/${rp._id || rp.id}`}
                  className={styles.relatedCard}
                >
                  <div className={styles.relatedImageWrapper}>
                    <img
                      src={rp.image || rp.gallery?.[0]}
                      alt={rp.name}
                      className={styles.relatedImage}
                      onError={handleImageError}
                    />
                  </div>
                  <div className={styles.relatedInfo}>
                    <span className={styles.relatedCategory}>
                      {rp.category}
                    </span>
                    <h4 className={styles.relatedName}>{rp.name}</h4>
                    <span className={styles.relatedPrice}>
                      {formatPrice(rp.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to shop */}
        <div className={styles.backRow}>
          <Link to="/shop" className={styles.backLink}>
            ← Seguir comprando
          </Link>
        </div>
      </main>

      <Footer />

      {/* ── Notification ────────────── */}
      <AnimatePresence>
        {showAddedNotification && (
          <motion.div
            className={styles.notification}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <span className={styles.notificationIcon}>✓</span>
            <span>Producto agregado al carrito</span>
            <Link to="/shop" className={styles.notificationLink}>
              Ver carrito →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Image Zoom Overlay ──── */}
      <AnimatePresence>
        {imageZoomed && (
          <motion.div
            className={styles.zoomOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImageZoomed(false)}
          >
            <motion.img
              src={currentImage}
              alt={product.name}
              className={styles.zoomImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onError={handleImageError}
            />
            <button
              className={styles.zoomClose}
              onClick={() => setImageZoomed(false)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetailPage;
