import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import styles from "./ShopSection.module.css";
import { Product } from "../../../../types/shop";
import { useCategories } from "../../../../hooks/useCategories";
import { useProducts } from "../../../../hooks/useProducts";
import { productService } from "../../../../services/productService";
import { CategoryService } from "../../../../services/categoryService";
import {
  handleProductConsult,
  handleCartOrder,
  getLoggedUser,
} from "../../../../utils/whatsappUtils";
import CategoryDropdownNav from "../../navigation/CategoryDropdownNav";
import HeroSlider from "./HeroSlider";
import { exportCatalogPDF } from "../../../../utils/pdfCatalog";
import { motion, AnimatePresence } from "framer-motion";

// Tipos para el carrito
interface CartItem {
  product: Product;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

const ShopSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  // Debounce para evitar llamadas en cada tecla
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "rating" | "featured"
  >("name");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isContactingExpert, setIsContactingExpert] = useState(false);
  const [loadingProductIds, setLoadingProductIds] = useState<string[]>([]);
  const [showMiniCart, setShowMiniCart] = useState(false);

  // Estado para exportación PDF
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  // Estado para modal de mayorista
  const [showWholesaleModal, setShowWholesaleModal] = useState(false);

  // Estado para manejo móvil y modal de subcategorías
  const [isMobile, setIsMobile] = useState(false);
  const [showSubcatModal, setShowSubcatModal] = useState(false);
  const [modalCategoryId, setModalCategoryId] = useState<string | null>(null);

  // Ref para evitar resetear subcategoría cuando viene de clic de subcategoría
  const isSubcategoryClick = useRef(false);

  // Estados para categorías expandibles
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  // 📄 Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [absoluteTotalProducts, setAbsoluteTotalProducts] = useState(0); // Total absoluto de productos (sin filtros)
  const productsPerPage = 12;
  const sectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);

  // Actualizar valor debounced del buscador
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const scrollToProducts = () => {
    // Desplaza suavemente a la sección de productos con un offset de 100px hacia arriba
    const el = productsSectionRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 130;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // Función helper para manejar errores de imagen
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (
      !img.src.includes("default-product.png") &&
      !img.src.includes("vite.svg")
    ) {
      // Primero intenta la imagen por defecto del servidor
      img.src = "http://localhost:3010/uploads/products/default-product.png";
    } else if (!img.src.includes("vite.svg")) {
      // Si la imagen del servidor también falla, usa el vite.svg local
      img.src = "/vite.svg";
    }
  };

  // Estados adicionales para conteos dinámicos
  const [categoryProductCounts, setCategoryProductCounts] = useState<
    Record<string, number>
  >({});

  // Usar hooks para obtener datos de la API
  const { categories, loading: categoriesLoading } = useCategories();

  // Log para verificar categorías - Solo una vez cuando cambien
  useEffect(() => {
    if (categories.length > 0 && !categoriesLoading) {
      // Buscar específicamente "Pipas"
      categories.find(
        (cat) =>
          cat.name?.toLowerCase().includes("pipa") ||
          cat.name?.toLowerCase().includes("pipe"),
      );

      // Mostrar estructura de Chuches y sus subcategorías
      const chuchesCategory = categories.find((cat) =>
        cat.name?.toLowerCase().includes("chuches"),
      );
      if (chuchesCategory) {
        categories.filter((cat) => {
          const parentId = cat.parentCategoryId;
          if (typeof parentId === "object" && parentId !== null) {
            const parentObj = parentId as any;
            return (
              (parentObj._id || parentObj.id) ===
              (chuchesCategory._id || chuchesCategory.id)
            );
          }
          return parentId === (chuchesCategory._id || chuchesCategory.id);
        });
      }
    }
  }, [categories, categoriesLoading]);

  // Filtrar categorías padre basándose en la estructura jerárquica de la base de datos
  const parentCategories = useMemo(() => {
    // Filtrar categorías level 1 (principales disponibles)
    // Buscar categorías level 0 (como CHUCHES), si no hay usar level 1
    let mainCategories = categories.filter((cat) => cat.level === 0);

    if (mainCategories.length === 0) {
      mainCategories = categories.filter((cat) => cat.level === 1);
    }

    return mainCategories;
  }, [categories]);

  // Función para obtener todas las subcategorías de una categoría padre
  const getSubcategoryIds = useCallback(
    (parentCategoryId: string): string[] => {
      const subcategories = categories.filter((cat) => {
        const parentId = cat.parentCategoryId;
        if (typeof parentId === "object" && parentId !== null) {
          const parentObj = parentId as any;
          return (parentObj._id || parentObj.id) === parentCategoryId;
        }
        return parentId === parentCategoryId;
      });

      let allIds = subcategories
        .map((cat) => cat._id || cat.id)
        .filter(Boolean) as string[];

      // Recursivamente obtener subcategorías de subcategorías
      subcategories.forEach((subcat) => {
        const subcatId = subcat._id || subcat.id;
        if (subcatId) {
          const nestedIds = getSubcategoryIds(subcatId);
          allIds = [...allIds, ...nestedIds];
        }
      });

      return allIds;
    },
    [categories],
  );

  // Estados adicionales para manejo jerárquico de productos
  const [hierarchicalProducts, setHierarchicalProducts] = useState<Product[]>(
    [],
  );
  const [hierarchicalLoading, setHierarchicalLoading] = useState(false);

  // Función para obtener productos jerárquicamente
  const fetchHierarchicalProducts = useCallback(async () => {
    if (!selectedCategory) {
      return;
    }

    setHierarchicalLoading(true);
    try {
      let categoryIdsToFetch: string[];

      if (selectedSubcategory) {
        // Si hay subcategoría seleccionada, buscar en esa subcategoría Y sus subcategorías hijas
        const subcategoryChildIds = getSubcategoryIds(selectedSubcategory);

        if (subcategoryChildIds.length > 0) {
          // Si la subcategoría tiene hijas, incluir tanto la subcategoría como sus hijas
          categoryIdsToFetch = [selectedSubcategory, ...subcategoryChildIds];
        } else {
          // Si no tiene hijas, buscar solo en la subcategoría
          categoryIdsToFetch = [selectedSubcategory];
        }
      } else {
        // Si no hay subcategoría, buscar en la categoría padre y todas sus subcategorías
        const subcategoryIds = getSubcategoryIds(selectedCategory);

        if (subcategoryIds.length > 0) {
          // Si tiene subcategorías, incluir tanto la categoría padre como las subcategorías
          // para cubrir el caso donde la categoría padre también tenga productos propios
          categoryIdsToFetch = [selectedCategory, ...subcategoryIds];
        } else {
          // Si no tiene subcategorías, buscar en la categoría padre directamente
          categoryIdsToFetch = [selectedCategory];
        }
      }

      // Primero: intentar una ÚNICA llamada al backend con múltiples categorías (si el backend lo soporta)
      try {
        const multiResponse = await productService.getAllProductsWithPagination(
          {
            categoryId: categoryIdsToFetch, // se envía como lista "id1,id2,..."
            search: debouncedSearch || undefined,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            sortBy: sortBy,
            featured: sortBy === "featured" ? true : undefined,
            page: currentPage,
            limit: productsPerPage,
          },
        );

        if (Array.isArray(multiResponse)) {
          setHierarchicalProducts(multiResponse);
          setTotalProducts(multiResponse.length);
          return;
        } else if (multiResponse.data && Array.isArray(multiResponse.data)) {
          setHierarchicalProducts(multiResponse.data);
          setTotalProducts(
            multiResponse.pagination?.total || multiResponse.data.length,
          );
          return;
        }
      } catch (e) {
        // Si falla, vamos al fallback optimizado
        console.warn(
          "⚠️ Backend no soporta múltiples categorías, usando fallback:",
          e,
        );
      }

      // Fallback: si el backend no soporta múltiples IDs, agrupar resultados en paralelo
      if (categoryIdsToFetch.length === 1) {
        try {
          const response = await productService.getAllProductsWithPagination({
            categoryId: categoryIdsToFetch[0],
            search: debouncedSearch || undefined,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            sortBy: sortBy,
            featured: sortBy === "featured" ? true : undefined,
            page: currentPage,
            limit: productsPerPage,
          });

          if (Array.isArray(response)) {
            setHierarchicalProducts(response);
            setTotalProducts(response.length);
          } else if (response.data && Array.isArray(response.data)) {
            setHierarchicalProducts(response.data);
            setTotalProducts(
              response.pagination?.total || response.data.length,
            );
          }
        } catch (error) {
          console.error(
            `Error fetching products for category ${categoryIdsToFetch[0]}:`,
            error,
          );
          setHierarchicalProducts([]);
          setTotalProducts(0);
        }
      } else {
        // Múltiples categorías: obtener todos en paralelo y aplicar paginación manual
        const allResponses = await Promise.allSettled(
          categoryIdsToFetch.map((categoryId) =>
            productService.getAllProductsWithPagination({
              categoryId,
              search: debouncedSearch || undefined,
              minPrice: priceRange[0],
              maxPrice: priceRange[1],
              sortBy: sortBy,
              featured: sortBy === "featured" ? true : undefined,
              page: 1,
              limit: 1000,
            }),
          ),
        );

        const allProducts: Product[] = [];
        allResponses.forEach((res, index) => {
          if (res.status === "fulfilled") {
            const response = res.value as any;
            if (Array.isArray(response)) {
              allProducts.push(...response);
            } else if (response.data && Array.isArray(response.data)) {
              allProducts.push(...response.data);
            }
          } else {
            console.error(
              `Error en categoría ${categoryIdsToFetch[index]}:`,
              res.reason,
            );
          }
        });

        // Remover duplicados por ID
        const uniqueProducts = allProducts.filter(
          (product, index, self) =>
            index ===
            self.findIndex(
              (p) => (p._id || p.id) === (product._id || product.id),
            ),
        );

        // Aplicar filtros de búsqueda y precio si no se aplicaron en el servidor
        let filteredProducts = uniqueProducts;

        if (debouncedSearch) {
          filteredProducts = filteredProducts.filter(
            (product) =>
              product.name
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase()) ||
              product.description
                ?.toLowerCase()
                .includes(debouncedSearch.toLowerCase()),
          );
        }

        if (priceRange[0] > 0 || priceRange[1] < 2000000) {
          filteredProducts = filteredProducts.filter(
            (product) =>
              product.price >= priceRange[0] && product.price <= priceRange[1],
          );
        }

        // Aplicar ordenamiento
        filteredProducts.sort((a, b) => {
          switch (sortBy) {
            case "name":
              return a.name.localeCompare(b.name);
            case "price":
              return a.price - b.price;
            case "rating":
              return (b.rating || 0) - (a.rating || 0);
            case "featured":
              return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            default:
              return 0;
          }
        });

        // Aplicar paginación manual
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        setHierarchicalProducts(paginatedProducts);
        setTotalProducts(filteredProducts.length);
      }
    } catch (error) {
      console.error("Error fetching hierarchical products:", error);
      setHierarchicalProducts([]);
      setTotalProducts(0);
    } finally {
      setHierarchicalLoading(false);
    }
  }, [
    selectedCategory,
    selectedSubcategory,
    getSubcategoryIds,
    debouncedSearch,
    priceRange,
    sortBy,
    currentPage,
    productsPerPage,
  ]);

  // Usar productos jerárquicos cuando hay categoría seleccionada, normal en caso contrario
  const {
    products: normalProducts,
    loading: normalLoading,
    pagination,
  } = useProducts({
    categoryId: !selectedCategory ? undefined : undefined, // Solo usar para "todos los productos"
    search: !selectedCategory ? debouncedSearch || undefined : undefined,
    minPrice: !selectedCategory ? priceRange[0] : undefined,
    maxPrice: !selectedCategory ? priceRange[1] : undefined,
    sortBy: !selectedCategory ? sortBy : undefined,
    featured: !selectedCategory && sortBy === "featured" ? true : undefined,
    page: !selectedCategory ? currentPage : undefined,
    limit: !selectedCategory ? productsPerPage : undefined,
  });

  // Determinar qué productos y loading usar
  const products = selectedCategory ? hierarchicalProducts : normalProducts;
  const productsLoading = selectedCategory
    ? hierarchicalLoading
    : normalLoading;

  // Efecto para cargar productos jerárquicos cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategory) {
      fetchHierarchicalProducts();
    } else {
    }
  }, [selectedCategory, fetchHierarchicalProducts]);

  // Actualizar total de productos cuando cambie la paginación (solo para productos normales)
  useEffect(() => {
    if (!selectedCategory) {
      const newTotal = pagination?.total || 0;
      setTotalProducts(newTotal);
    }
  }, [pagination, selectedCategory]);

  // Obtener el total absoluto de productos (sin filtros) al cargar el componente
  useEffect(() => {
    const fetchAbsoluteTotalProducts = async () => {
      try {
        const totalCount = await productService.getAllProductsCount();
        setAbsoluteTotalProducts(totalCount);
      } catch (error) {
        console.error("Error fetching absolute total products:", error);
      }
    };

    // Demorar levemente para no competir con otras llamadas iniciales
    const t = setTimeout(fetchAbsoluteTotalProducts, 200);
    return () => clearTimeout(t);
  }, []); // Solo se ejecuta una vez al montar el componente

  // Obtener conteos jerárquicos de productos por categoría padre
  useEffect(() => {
    const fetchCategoryProductCounts = async () => {
      if (!categories || categories.length === 0) return;

      try {
        // Intentar recuperar desde cache (sessionStorage) por 5 minutos
        const CACHE_KEY = "shop-category-counts-v2";
        const raw = sessionStorage.getItem(CACHE_KEY);
        const now = Date.now();
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as {
              timestamp: number;
              counts: Record<string, number>;
              size: number;
            };
            if (
              now - parsed.timestamp < 5 * 60 * 1000 &&
              parsed.size === categories.length
            ) {
              setCategoryProductCounts(parsed.counts);
              return;
            }
          } catch {}
        }

        // PRIMER INTENTO: una sola llamada al backend para todos los conteos
        try {
          const single = await CategoryService.getProductCounts({
            includeParents: true,
            includeLeaves: true,
            rollupParents: true,
          });
          if (single.success && single.data?.counts) {
            setCategoryProductCounts(single.data.counts);
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                timestamp: now,
                counts: single.data.counts,
                size: categories.length,
              }),
            );
            return;
          }
        } catch (e) {
          console.warn(
            "Counts single-call endpoint not available, using fallback",
            e,
          );
        }

        // FALLBACK: Construir promesas en paralelo para categorías padre (incluyendo subcategorías)
        const parentPromises = parentCategories.map(async (category) => {
          const categoryId = category.id || category._id;
          if (!categoryId) return { id: "", count: 0 };

          const subcategoryIds = getSubcategoryIds(categoryId);
          const allCategoryIds = [categoryId, ...subcategoryIds];

          try {
            const response = await productService.getAllProductsWithPagination({
              categoryId: allCategoryIds,
              page: 1,
              limit: 1,
            });
            let total = 0;
            if (Array.isArray(response)) total = response.length;
            else if (response.pagination && response.pagination.total)
              total = response.pagination.total;
            return { id: categoryId, count: total };
          } catch (e) {
            return { id: categoryId, count: 0 };
          }
        });

        // Categorías hoja: sin subcategorías
        const leafCategories = categories.filter((category) => {
          const categoryId = category.id || category._id;
          if (!categoryId) return false;
          const hasSubcategories = categories.some((cat) => {
            const parentId = cat.parentCategoryId;
            if (typeof parentId === "object" && parentId !== null) {
              const parentObj = parentId as any;
              return (parentObj._id || parentObj.id) === categoryId;
            }
            return parentId === categoryId;
          });
          return !hasSubcategories;
        });

        const leafPromises = leafCategories.map(async (category) => {
          const categoryId = category.id || category._id;
          if (!categoryId) return { id: "", count: 0 };
          try {
            const response = await productService.getAllProductsWithPagination({
              categoryId: categoryId,
              page: 1,
              limit: 1,
            });
            let total = 0;
            if (Array.isArray(response)) total = response.length;
            else if (response.pagination && response.pagination.total)
              total = response.pagination.total;
            return { id: categoryId, count: total };
          } catch (e) {
            return { id: categoryId, count: 0 };
          }
        });

        const results = await Promise.allSettled([
          ...parentPromises,
          ...leafPromises,
        ]);

        const counts: Record<string, number> = {};
        results.forEach((res) => {
          if (res.status === "fulfilled") {
            const r = res.value as { id: string; count: number };
            if (r.id) counts[r.id] = r.count;
          }
        });

        setCategoryProductCounts(counts);
        // Guardar cache
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: now, counts, size: categories.length }),
        );
      } catch (error) {
        console.error("Error fetching category product counts:", error);
      }
    };

    // Debounce para no recalcular demasiadas veces
    const t = setTimeout(fetchCategoryProductCounts, 200);
    return () => clearTimeout(t);
  }, [categories, parentCategories, getSubcategoryIds]); // Se ejecuta cuando las categorías cambian

  // Cargar carrito del localStorage al inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem("arcoiris-cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("arcoiris-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Detectar vista móvil (alineado con breakpoint CSS 767px)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 767);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Cerrar mini carrito al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest(`.${styles.floatingCartContainer}`) && showMiniCart) {
        setShowMiniCart(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMiniCart]);

  // Funciones del carrito
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const productId = product.id || product._id;
      if (!productId) return prevCart;

      const existingItem = prevCart.items.find(
        (item) => (item.product.id || item.product._id) === productId,
      );

      let newItems: CartItem[];
      if (existingItem) {
        newItems = prevCart.items.map((item) =>
          (item.product.id || item.product._id) === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      } else {
        newItems = [...prevCart.items, { product, quantity }];
      }

      const total = newItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    });
  };

  const removeFromCart = (productId: string | number) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(
        (item) => (item.product.id || item.product._id) !== productId,
      );
      const total = newItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    });
  };

  const updateQuantity = (productId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        (item.product.id || item.product._id) === productId
          ? { ...item, quantity }
          : item,
      );
      const total = newItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    });
  };

  const getCartItemQuantity = (
    productId: string | number | undefined,
  ): number => {
    if (!productId) return 0;
    const item = cart.items.find(
      (item) => (item.product.id || item.product._id) === productId,
    );
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, itemCount: 0 });
  };

  // 📄 Funciones para manejar categorías expandibles
  // Abrir/cerrar modal de subcategorías (solo móvil)
  const openSubcategoriesModal = useCallback((categoryId: string) => {
    setModalCategoryId(categoryId);
    setShowSubcatModal(true);
  }, []);

  const closeSubcategoriesModal = useCallback(() => {
    setShowSubcatModal(false);
    setModalCategoryId(null);
  }, []);

  // Función para encontrar subcategorías hermanas (mismo nivel/padre)
  const findSiblingSubcategories = useCallback(
    (subcategoryId: string): string[] => {
      // Encontrar la subcategoría actual
      const currentSubcategory = categories.find((c) => {
        const id = c.id || c._id;
        return id?.toString() === subcategoryId?.toString();
      });

      if (!currentSubcategory) return [];

      // Obtener el parentCategoryId de la subcategoría actual
      const parentId = currentSubcategory.parentCategoryId;
      let parentCategoryId: string | null = null;

      if (typeof parentId === "object" && parentId !== null) {
        const parentObj = parentId as any;
        parentCategoryId = parentObj._id || parentObj.id;
      } else if (typeof parentId === "string") {
        parentCategoryId = parentId;
      }

      if (!parentCategoryId) return [];

      // Encontrar todas las subcategorías hermanas (con el mismo padre)
      const siblings = categories
        .filter((cat) => {
          const catParentId = cat.parentCategoryId;
          let catParentCategoryId: string | null = null;

          if (typeof catParentId === "object" && catParentId !== null) {
            const catParentObj = catParentId as any;
            catParentCategoryId = catParentObj._id || catParentObj.id;
          } else if (typeof catParentId === "string") {
            catParentCategoryId = catParentId;
          }

          return catParentCategoryId === parentCategoryId;
        })
        .map((cat) => cat.id || cat._id || "")
        .filter((id) => id !== subcategoryId && id !== ""); // Excluir la subcategoría actual

      return siblings;
    },
    [categories],
  );

  const toggleCategoryExpansion = useCallback(
    (
      categoryId: string,
      event?: React.MouseEvent,
      options?: { forceToggle?: boolean },
    ) => {
      // Prevenir la selección de categoría cuando se hace clic en el botón de expansión
      if (event) {
        event.stopPropagation();
      }

      const forceToggle = options?.forceToggle ?? false;

      // En móvil, abrir modal en lugar de expandir el card (excepto dentro del propio modal)
      if (isMobile && !forceToggle) {
        openSubcategoriesModal(categoryId);
        return;
      }

      setExpandedCategories((prev) => {
        const newSet = new Set(prev);
        const isCurrentlyExpanded = newSet.has(categoryId);

        if (isCurrentlyExpanded) {
          // Si está expandido, solo contraerlo
          newSet.delete(categoryId);
        } else {
          // Si va a expandirse, encontrar y cerrar subcategorías hermanas
          const siblings = findSiblingSubcategories(categoryId);
          siblings.forEach((siblingId) => {
            newSet.delete(siblingId);
          });

          // Expandir la subcategoría actual
          newSet.add(categoryId);
        }

        return newSet;
      });
    },
    [isMobile, openSubcategoriesModal, findSiblingSubcategories],
  );

  // Función para encontrar la categoría padre raíz de cualquier subcategoría
  const findRootCategory = useCallback(
    (subcategoryId: string): string | null => {
      const subcategory = categories.find((c) => {
        const id = c.id || c._id;
        return id?.toString() === subcategoryId?.toString();
      });

      if (!subcategory) return null;

      const parentId = subcategory.parentCategoryId;
      let parentCategoryId: string | null = null;

      if (typeof parentId === "object" && parentId !== null) {
        const parentObj = parentId as any;
        parentCategoryId = parentObj._id || parentObj.id;
      } else if (typeof parentId === "string") {
        parentCategoryId = parentId;
      }

      if (!parentCategoryId) return null;

      // Verificar si el padre es una categoría raíz (no tiene padre)
      const parentCategory = categories.find((c) => {
        const id = c.id || c._id;
        return id?.toString() === parentCategoryId?.toString();
      });

      if (!parentCategory) return null;

      // Si el padre no tiene parentCategoryId, es una categoría raíz
      if (!parentCategory.parentCategoryId) {
        return parentCategoryId;
      }

      // Si tiene padre, buscar recursivamente
      return findRootCategory(parentCategoryId);
    },
    [categories],
  );

  const handleSubcategoryClick = useCallback(
    (
      subcategoryId: string,
      event: React.MouseEvent,
      options?: { skipScroll?: boolean },
    ) => {
      event.stopPropagation(); // Prevent parent category selection

      // Encontrar la categoría padre raíz de esta subcategoría
      const rootCategoryId = findRootCategory(subcategoryId);

      // Marcar que este cambio viene de un clic de subcategoría
      isSubcategoryClick.current = true;

      // Establecer ambos estados
      setSelectedSubcategory(subcategoryId);
      if (rootCategoryId) {
        setSelectedCategory(rootCategoryId);
      }
      if (!options?.skipScroll) {
        scrollToProducts();
      }
    },
    [scrollToProducts, findRootCategory],
  );

  // Función recursiva para renderizar subcategorías anidadas
  const renderSubcategories = useCallback(
    (
      parentCategoryId: string,
      level: number = 1,
      inModal: boolean = false,
    ): React.ReactElement[] => {
      const subcategories = categories.filter((cat) => {
        const parentId = cat.parentCategoryId;
        if (typeof parentId === "object" && parentId !== null) {
          const parentObj = parentId as any;
          return (parentObj._id || parentObj.id) === parentCategoryId;
        }
        return parentId === parentCategoryId;
      });

      return subcategories.map((subcat) => {
        const subcatId = subcat.id || subcat._id || "";
        const isSubcatSelected = selectedSubcategory === subcatId;
        const isSubcatExpanded = expandedCategories.has(subcatId);

        // Verificar si esta subcategoría tiene sus propias subcategorías
        const hasNestedSubcategories = categories.some((cat) => {
          const parentId = cat.parentCategoryId;
          if (typeof parentId === "object" && parentId !== null) {
            const parentObj = parentId as any;
            return (parentObj._id || parentObj.id) === subcatId;
          }
          return parentId === subcatId;
        });

        // Verificar si es categoría hoja (puede contener productos)
        const isLeafCategory = !hasNestedSubcategories;

        return (
          <div
            key={subcatId}
            className={`${styles.subcategoryContainer} ${
              isSubcatSelected ? styles.selected : ""
            }`}
            style={{ paddingLeft: `${level * 16}px` }}
          >
            <div
              className={`${styles.subcategoryItem} ${hasNestedSubcategories ? styles.hasChildren : styles.hasProducts}`}
            >
              <div
                className={styles.subcategoryContent}
                onClick={(e) => {
                  // SIEMPRE permitir clic en subcategorías, tanto hojas como padre
                  if (inModal) {
                    // En móviles con modal: seleccionar y cerrar, luego scroll normal
                    handleSubcategoryClick(subcatId, e);
                    closeSubcategoriesModal();
                    return;
                  }

                  // En pantallas grandes (inline): primero contraer para que el layout se ajuste,
                  // y luego scrollear, asegurando la misma posición que al elegir la categoría padre
                  const root = findRootCategory(subcatId);
                  handleSubcategoryClick(subcatId, e, { skipScroll: true });

                  if (root) {
                    setExpandedCategories((prev) => {
                      const s = new Set(prev);
                      s.delete(root);
                      return s;
                    });
                  }

                  // Espera a que termine la transición de colapso (CSS ~0.4s) antes de scrollear
                  const COLLAPSE_MS = 420;
                  setTimeout(() => {
                    scrollToProducts();
                  }, COLLAPSE_MS);
                }}
                style={{ cursor: "pointer" }} // Siempre mostrar cursor pointer
              >
                <span className={styles.subcategoryName}>
                  {isLeafCategory ? "🏷️" : "📁"} {subcat.name}
                </span>
                {/* Solo mostrar conteo si es categoría hoja */}
                {isLeafCategory && (
                  <span className={styles.subcategoryCount}>
                    {categoryProductCounts[subcatId] || 0}
                  </span>
                )}
              </div>

              {/* Botón de expansión para subcategorías que tienen hijas */}
              {hasNestedSubcategories && (
                <button
                  className={`${styles.subcategoryExpandButton} ${
                    isSubcatExpanded ? styles.expanded : ""
                  }`}
                  onClick={(e) =>
                    toggleCategoryExpansion(subcatId, e, {
                      forceToggle: inModal,
                    })
                  }
                  aria-label={
                    isSubcatExpanded
                      ? "Contraer subcategorías"
                      : "Expandir subcategorías"
                  }
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d={isSubcatExpanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Renderizar subcategorías anidadas recursivamente */}
            {hasNestedSubcategories && isSubcatExpanded && (
              <div className={styles.nestedSubcategories}>
                {renderSubcategories(subcatId, level + 1, inModal)}
              </div>
            )}
          </div>
        );
      });
    },
    [
      categories,
      selectedSubcategory,
      expandedCategories,
      categoryProductCounts,
      handleSubcategoryClick,
      toggleCategoryExpansion,
      closeSubcategoriesModal,
      findRootCategory,
    ],
  );

  // 📄 Funciones de paginación
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      scrollToProducts();
    }
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, searchTerm, priceRange, sortBy]);

  // Resetear subcategoría cuando cambie la categoría padre (solo si no viene de clic de subcategoría)
  useEffect(() => {
    if (!isSubcategoryClick.current) {
      setSelectedSubcategory(null);
    }
    // Reset the flag after processing
    isSubcategoryClick.current = false;
  }, [selectedCategory]);

  // Filtrar productos se hace automáticamente con los filtros del hook
  // Los productos ya vienen filtrados desde la API

  // Los productos ya vienen ordenados desde la API según el sortBy

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setModalQuantity(1);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setCurrentImageIndex(0);
    setModalQuantity(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Exportar catálogo como PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const categoryName = selectedCategory
        ? categories.find(
            (c) =>
              (c.id || c._id)?.toString() === selectedCategory?.toString(),
          )?.name
        : undefined;
      await exportCatalogPDF(hierarchicalProducts, categoryName);
    } catch (error) {
      console.error("Error exportando PDF:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Contactar admin para ventas por mayor
  const handleWholesaleContact = () => {
    const message = encodeURIComponent(
      "¡Hola! Estoy interesado/a en compras por mayor de Arcoiris Joyería. ¿Podrían brindarme más información sobre precios mayoristas y condiciones?"
    );
    window.open(`https://wa.me/+5493585009887?text=${message}`, "_blank");
    setShowWholesaleModal(false);
  };

  // Función para obtener la ruta completa de categorías (breadcrumb)
  const getCategoryPath = (
    categoryId: string | null,
    subcategoryId: string | null,
  ): string => {
    if (categoryId === null) return "Todos los productos";

    const category = categories.find((c) => {
      const id = c.id || c._id;
      return id?.toString() === categoryId?.toString();
    });

    if (!category) return "Categoría";

    let path = category.name;

    // Si hay una subcategoría seleccionada, construir la ruta completa
    if (subcategoryId) {
      const buildSubcategoryPath = (
        subId: string,
        currentPath: string = "",
      ): string => {
        const subcategory = categories.find((c) => {
          const id = c.id || c._id;
          return id?.toString() === subId?.toString();
        });

        if (!subcategory) return currentPath;

        // Verificar si esta subcategoría tiene padre
        const parentId = subcategory.parentCategoryId;
        let parentSubcategoryId: string | null = null;

        if (typeof parentId === "object" && parentId !== null) {
          const parentObj = parentId as any;
          parentSubcategoryId = parentObj._id || parentObj.id;
        } else if (typeof parentId === "string") {
          parentSubcategoryId = parentId;
        }

        // Si el padre no es la categoría principal, construir recursivamente
        if (parentSubcategoryId && parentSubcategoryId !== categoryId) {
          const parentPath = buildSubcategoryPath(
            parentSubcategoryId,
            currentPath,
          );
          return parentPath
            ? `${parentPath} › ${subcategory.name}`
            : subcategory.name;
        } else {
          // Es hija directa de la categoría principal
          return currentPath
            ? `${currentPath} › ${subcategory.name}`
            : subcategory.name;
        }
      };

      const subcategoryPath = buildSubcategoryPath(subcategoryId);
      if (subcategoryPath) {
        path = `${path} › ${subcategoryPath}`;
      }
    }

    return path;
  };

  // Verificar si hay admin logueado para ajustar estilos
  const currentUser = getLoggedUser();
  const isAdmin = currentUser?.isAdmin || false;
  const [isSearchStuck, setIsSearchStuck] = useState(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);

  // Usar siempre el mismo offset para navbar consistente
  const stickyOffset = 80; // Altura estándar de la navbar

  useEffect(() => {
    // Detectar cuando mostrar el buscador flotante
    const handleScroll = () => {
      const searchSection = document.getElementById("shop-search-section");
      if (!searchSection) return;

      const rect = searchSection.getBoundingClientRect();
      const isSearchVisible = rect.bottom > 0 && rect.top < window.innerHeight;

      // Mostrar flotante cuando la búsqueda original no esté visible
      setShowFloatingSearch(!isSearchVisible && window.scrollY > 200);

      // Mantener la lógica de sombra para el sticky original
      const el = document.getElementById("shop-search-wrapper");
      if (el) {
        const { top } = el.getBoundingClientRect();
        setIsSearchStuck(top <= stickyOffset + 2);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [stickyOffset]);

  // Bloquear scroll del body cuando el modal de subcategorías esté abierto
  useEffect(() => {
    if (showSubcatModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showSubcatModal]);

  return (
    <section
      ref={sectionRef}
      id="shop"
      className={`${styles.shop} ${!isAdmin ? styles.noNavigation : ""}`}
    >
      {/* Background Effects */}
      <div className={styles.backgroundEffects}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.gradientOrb3}></div>
      </div>

      <div className={styles.container}>
        {/* Hero Slider */}
        <HeroSlider />

        {/* Action Buttons Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 0',
          flexWrap: 'wrap',
        }}>
          {/* Wholesale Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWholesaleModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              background: 'linear-gradient(135deg, #0E4E4E, #1a6b6b)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(14,78,78,0.2)',
            }}
          >
            📦 Compras por Mayor
          </motion.button>

          {/* PDF Export Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportPDF}
            disabled={isExportingPDF || hierarchicalProducts.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              background: isExportingPDF
                ? '#ccc'
                : 'linear-gradient(135deg, #CAA135, #E5C872)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isExportingPDF ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(199,155,48,0.3)',
            }}
          >
            {isExportingPDF ? '⏳ Exportando...' : '📄 Exportar Catálogo PDF'}
          </motion.button>
        </div>

        {/* Search and Filters — Arcoiris Design */}
        <section id="shop-search-section" className={styles.searchSection}>
          <div
            id="shop-search-wrapper"
            className={`${styles.stickySearch} ${isSearchStuck ? styles.stuckShadow : ""}`}
            style={{ top: stickyOffset }}
          >
            <div className={styles.searchContainer}>
              {/* Barra principal: búsqueda + ordenar + filtros en una línea */}
              <div className={styles.searchRow}>
                <div className={styles.searchBar}>
                  <svg
                    className={styles.searchIcon}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar joyas, anillos, collares..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        scrollToProducts();
                      }
                    }}
                    className={styles.searchInput}
                  />
                  {searchTerm && (
                    <button
                      className={styles.searchClear}
                      onClick={() => setSearchTerm("")}
                      aria-label="Limpiar búsqueda"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>

                <div className={styles.filterActions}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={styles.sortSelect}
                  >
                    <option value="name">Nombre A-Z</option>
                    <option value="featured">Destacados</option>
                    <option value="price">Precio ↑</option>
                    <option value="rating">Mejor valorados</option>
                  </select>

                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`${styles.filterToggle} ${showAdvancedFilters ? styles.filterToggleActive : ""}`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="4" y1="6" x2="20" y2="6"></line>
                      <line x1="8" y1="12" x2="20" y2="12"></line>
                      <line x1="12" y1="18" x2="20" y2="18"></line>
                      <circle cx="6" cy="12" r="2"></circle>
                      <circle cx="10" cy="18" r="2"></circle>
                    </svg>
                    <span className={styles.filterToggleLabel}>Filtros</span>
                  </button>
                </div>
              </div>

              {/* Panel de filtros avanzados */}
              {showAdvancedFilters && (
                <div className={styles.advancedFilters}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M2 12h20"></path>
                      </svg>
                      Rango de precios
                    </label>
                    <div className={styles.priceRange}>
                      <div className={styles.priceInputRow}>
                        <div className={styles.priceInputWrap}>
                          <span className={styles.pricePrefix}>$</span>
                          <input
                            type="number"
                            min="0"
                            max="2000000"
                            value={priceRange[0]}
                            onChange={(e) =>
                              setPriceRange([Number(e.target.value), priceRange[1]])
                            }
                            className={styles.priceInput}
                          />
                        </div>
                        <span className={styles.priceSeparator}>—</span>
                        <div className={styles.priceInputWrap}>
                          <span className={styles.pricePrefix}>$</span>
                          <input
                            type="number"
                            min="0"
                            max="2000000"
                            value={priceRange[1]}
                            onChange={(e) =>
                              setPriceRange([priceRange[0], Number(e.target.value)])
                            }
                            className={styles.priceInput}
                          />
                        </div>
                      </div>
                      <div className={styles.rangeTrack}>
                        <input
                          type="range"
                          min="0"
                          max="2000000"
                          value={priceRange[0]}
                          onChange={(e) =>
                            setPriceRange([Number(e.target.value), priceRange[1]])
                          }
                          className={styles.rangeSlider}
                        />
                        <input
                          type="range"
                          min="0"
                          max="2000000"
                          value={priceRange[1]}
                          onChange={(e) =>
                            setPriceRange([priceRange[0], Number(e.target.value)])
                          }
                          className={styles.rangeSlider}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Categories - New Dropdown Navigation */}
        <CategoryDropdownNav
          categories={categories}
          parentCategories={parentCategories}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          categoryProductCounts={categoryProductCounts}
          onCategorySelect={(categoryId) => {
            setSelectedCategory(categoryId);
            setSelectedSubcategory(null);
            scrollToProducts();
          }}
          onSubcategorySelect={(subcategoryId, event) => {
            handleSubcategoryClick(subcategoryId, event);
          }}
          absoluteTotalProducts={absoluteTotalProducts}
          loading={categoriesLoading}
        />

        {/* Modal de Subcategorías (solo móviles) */}
        {showSubcatModal && isMobile && modalCategoryId && (
          <div
            className={styles.subcategoriesModal}
            onClick={closeSubcategoriesModal}
          >
            <div
              className={styles.subcategoriesModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.subcategoriesModalHeader}>
                <h3 className={styles.subcategoriesModalTitle}>
                  {
                    categories.find(
                      (c) => (c.id || c._id)?.toString() === modalCategoryId,
                    )?.name
                  }
                </h3>
                <button
                  className={styles.closeSubcategoriesButton}
                  onClick={closeSubcategoriesModal}
                  aria-label="Cerrar"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className={styles.subcategoriesModalBody}>
                <div className={styles.subcategoriesHeader}>Filtrar por:</div>
                <div className={styles.subcategoriesList}>
                  {renderSubcategories(modalCategoryId, 1, true)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        <section className={styles.productsSection} ref={productsSectionRef}>
          <div className={styles.productsHeader}>
            <h2 className={styles.productsTitle}>
              {getCategoryPath(selectedCategory, selectedSubcategory)}
            </h2>
            <div className={styles.productsCount}>
              {totalProducts} productos encontrados
              {totalProducts > productsPerPage && (
                <span className={styles.paginationInfo}>
                  • Página {currentPage} de {totalPages}
                </span>
              )}
            </div>
          </div>

          {productsLoading ? (
            <div className={styles.productsGrid}>
              {[...Array(6)].map((_, index) => (
                <div key={index} className={styles.productCard}>
                  <div className={styles.productImageContainer}>
                    <div
                      style={{
                        width: "100%",
                        height: "280px",
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                      }}
                    >
                      ⏳
                    </div>
                  </div>
                  <div className={styles.productInfo}>
                    <div className={styles.productName}>
                      Cargando producto...
                    </div>
                    <p className={styles.productDescription}>
                      Obteniendo información del producto
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className={styles.productsGrid}>
              {products.map((product: Product, index: number) => (
                <article
                  key={product.id || product._id}
                  className={`${styles.productCard} ${product.featured ? styles.featured : ""}`}
                  onClick={() => window.open(`/producto/${product._id || product.id}`, '_blank')}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={styles.productImageContainer}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className={styles.productImage}
                      onError={handleImageError}
                    />

                    <div className={styles.productBadges}>
                      {product.discount && (
                        <span className={styles.discountBadge}>
                          -{product.discount}%
                        </span>
                      )}
                      {product.featured && (
                        <span className={styles.featuredBadge}>
                          ⭐ Destacado
                        </span>
                      )}
                    </div>

                    <div className={styles.productOverlay}>
                      <button className={styles.quickViewBtn}>
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className={styles.productInfo}>
                    <div className={styles.productCategory}>
                      {product.category}
                    </div>

                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productDescription}>
                      {product.description}
                    </p>

                    <div className={styles.productRating}>
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
                      <span className={styles.ratingValue}>
                        {product.rating} ({product.reviews} reviews)
                      </span>
                    </div>

                    <div className={styles.productTags}>
                      {(product.tags || []).slice(0, 3).map((tag, index) => (
                        <span key={index} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className={styles.productFooter}>
                      <div className={styles.productPrice}>
                        {product.originalPrice && (
                          <span className={styles.originalPrice}>
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                        <span className={styles.currentPrice}>
                          {formatPrice(product.price)}
                        </span>
                      </div>

                      <div className={styles.productActions}>
                        <button
                          className={`${styles.addToCartBtn} ${loadingProductIds.includes(String(product.id || product._id)) ? styles.loading : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const productId = product.id || product._id;
                            if (!productId) return;

                            // Añadir este producto a la lista de cargando
                            setLoadingProductIds((prev) => [
                              ...prev,
                              String(productId),
                            ]);

                            // Simulamos una petición a la API con un timeout
                            setTimeout(() => {
                              // Agregamos al carrito después del timeout
                              addToCart(product, 1);

                              // Quitamos este producto de la lista de cargando
                              setLoadingProductIds((prev) =>
                                prev.filter((id) => id !== String(productId)),
                              );

                              // Mostrar el mini carrito
                              setShowMiniCart(true);
                            }, 1500);
                          }}
                          disabled={
                            !product.inStock ||
                            loadingProductIds.includes(
                              String(product.id || product._id),
                            )
                          }
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                          {loadingProductIds.includes(
                            String(product.id || product._id),
                          ) ? (
                            <span>Agregando...</span>
                          ) : getCartItemQuantity(product.id || product._id) >
                            0 ? (
                            <span>
                              En carrito (
                              {getCartItemQuantity(product.id || product._id)})
                            </span>
                          ) : (
                            <span>Agregar</span>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={styles.productStock}>
                      <span
                        className={`${styles.stockDot} ${product.inStock ? styles.inStock : styles.outOfStock}`}
                      ></span>
                      <span
                        className={
                          product.inStock ? styles.inStock : styles.outOfStock
                        }
                      >
                        {product.inStock
                          ? `En stock (${product.stockCount})`
                          : "Sin stock"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.noProducts}>
              <div className={styles.noProductsIcon}>🔍</div>
              <h3>No se encontraron productos</h3>
              <p>
                Intenta ajustar los filtros o términos de búsqueda para
                encontrar lo que buscas.
              </p>
            </div>
          )}

          {/* 📄 Componente de Paginación */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationContainer}>
                <button
                  className={`${styles.paginationButton} ${styles.paginationPrev}`}
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="15,18 9,12 15,6"></polyline>
                  </svg>
                  Anterior
                </button>

                <div className={styles.paginationNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        className={`${styles.paginationNumber} ${
                          pageNumber === currentPage ? styles.active : ""
                        }`}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  className={`${styles.paginationButton} ${styles.paginationNext}`}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </button>
              </div>

              <div className={styles.paginationInfo}>
                Mostrando {(currentPage - 1) * productsPerPage + 1}-
                {Math.min(currentPage * productsPerPage, totalProducts)} de{" "}
                {totalProducts} productos
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className={styles.cartModal} onClick={() => setIsCartOpen(false)}>
          <div
            className={styles.cartModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.cartHeader}>
              <h2 className={styles.cartTitle}>
                🛒 Carrito de Compras
                {cart.itemCount > 0 && (
                  <span className={styles.cartItemCount}>
                    ({cart.itemCount} items)
                  </span>
                )}
              </h2>
              <button
                className={styles.closeCartButton}
                onClick={() => setIsCartOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.cartBody}>
              {cart.items.length === 0 ? (
                <div className={styles.emptyCart}>
                  <div className={styles.emptyCartIcon}>🛒</div>
                  <h3>Tu carrito está vacío</h3>
                  <p>Agrega algunos productos increíbles para comenzar</p>
                  <button
                    className={styles.continueShopping}
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continuar Comprando
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.cartItems}>
                    {cart.items.map((item) => (
                      <div
                        key={item.product.id || item.product._id}
                        className={styles.cartItem}
                      >
                        <div className={styles.cartItemImage}>
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            onError={handleImageError}
                          />
                        </div>

                        <div className={styles.cartItemInfo}>
                          <h4 className={styles.cartItemName}>
                            {item.product.name}
                          </h4>
                          <p className={styles.cartItemCategory}>
                            {item.product.category}
                          </p>
                          <div className={styles.cartItemPrice}>
                            {formatPrice(item.product.price)}
                          </div>
                        </div>

                        <div className={styles.cartItemControls}>
                          <div className={styles.quantityControls}>
                            <button
                              onClick={() => {
                                const productId =
                                  item.product.id || item.product._id;
                                if (productId) {
                                  updateQuantity(productId, item.quantity - 1);
                                }
                              }}
                              className={styles.quantityBtn}
                            >
                              -
                            </button>
                            <span className={styles.quantity}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                const productId =
                                  item.product.id || item.product._id;
                                if (productId) {
                                  updateQuantity(productId, item.quantity + 1);
                                }
                              }}
                              className={styles.quantityBtn}
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              const productId =
                                item.product.id || item.product._id;
                              if (productId) {
                                removeFromCart(productId);
                              }
                            }}
                            className={styles.removeBtn}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                          </button>
                        </div>

                        <div className={styles.cartItemTotal}>
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.cartFooter}>
                    <div className={styles.cartSummary}>
                      <div className={styles.cartTotal}>
                        <div className={styles.totalRow}>
                          <span>Subtotal:</span>
                          <span>{formatPrice(cart.total)}</span>
                        </div>
                        <div className={styles.totalRow}>
                          <span>Envío:</span>
                          <span>Acordar</span>
                        </div>
                        <div className={styles.totalRowFinal}>
                          <span>Total:</span>
                          <span>{formatPrice(cart.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cartActions}>
                      <button
                        onClick={clearCart}
                        className={styles.clearCartBtn}
                      >
                        Vaciar Carrito
                      </button>
                      <button
                        className={styles.checkoutBtn}
                        onClick={() => handleCartOrder(cart.items)}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Realizar Pedido
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart */}
      <div className={styles.floatingCartContainer}>
        <button
          className={styles.floatingCart}
          onClick={() => setShowMiniCart(!showMiniCart)}
          aria-label="Ver carrito"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {cart.itemCount > 0 && (
            <span className={styles.floatingCartCount}>{cart.itemCount}</span>
          )}
          {cart.total > 0 && (
            <span className={styles.floatingCartTotal}>
              {formatPrice(cart.total)}
            </span>
          )}
        </button>

        <div
          className={`${styles.floatingMiniCart} ${showMiniCart ? styles.visible : ""}`}
        >
          <div className={styles.miniCartHeader}>
            <h5 className={styles.miniCartTitle}>
              🛒 Carrito
              {cart.itemCount > 0 && (
                <span className={styles.miniCartItemCount}>
                  ({cart.itemCount})
                </span>
              )}
            </h5>
          </div>

          <div className={styles.miniCartBody}>
            {cart.items.length === 0 ? (
              <div className={styles.emptyMiniCart}>
                <div className={styles.emptyMiniCartIcon}>🛒</div>
                <h5>Tu carrito está vacío</h5>
                <p>¡Agrega productos para comenzar!</p>
                <button
                  className={styles.startShoppingBtn}
                  onClick={() => setShowMiniCart(false)}
                >
                  Empezar a comprar
                </button>
              </div>
            ) : (
              cart.items.slice(0, 4).map((item) => (
                <div
                  key={item.product.id || item.product._id}
                  className={styles.miniCartItem}
                >
                  <div className={styles.miniCartItemImage}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      onError={handleImageError}
                    />
                  </div>
                  <div className={styles.miniCartItemInfo}>
                    <h6 className={styles.miniCartItemName}>
                      {item.product.name}
                    </h6>
                    <div className={styles.miniCartItemPrice}>
                      {formatPrice(item.product.price)}
                      <span className={styles.miniCartQuantity}>
                        {" "}
                        x{item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            {cart.items.length > 4 && (
              <div
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  padding: "8px 0",
                  color: "#64748b",
                }}
              >
                Y {cart.items.length - 4} productos más...
              </div>
            )}
          </div>

          {cart.items.length > 0 && (
            <div className={styles.miniCartFooter}>
              <div className={styles.miniCartTotal}>
                <span>Total:</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div className={styles.miniCartActions}>
                <button
                  className={styles.viewCartBtn}
                  onClick={() => {
                    setShowMiniCart(false);
                    setIsCartOpen(true);
                  }}
                >
                  Ver carrito
                </button>
                <button
                  className={styles.checkoutMiniBtn}
                  onClick={() => handleCartOrder(cart.items)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginRight: "6px" }}
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Pedido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Product Modal */}
      {selectedProduct && (
        <div className={styles.productModal} onClick={closeProductModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeButton} onClick={closeProductModal}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className={styles.modalBody}>
              {/* Left Section - Image Gallery */}
              <div className={styles.modalImageSection}>
                <div className={styles.modalImageContainer}>
                  <img
                    src={
                      selectedProduct.gallery?.[currentImageIndex] ||
                      selectedProduct.image
                    }
                    alt={selectedProduct.name}
                    className={styles.modalMainImage}
                    onError={handleImageError}
                  />
                  {selectedProduct.featured && (
                    <div className={styles.modalFeaturedBadge}>
                      ⭐ Destacado
                    </div>
                  )}
                  {selectedProduct.discount && (
                    <div className={styles.modalDiscountBadge}>
                      -{selectedProduct.discount}%
                    </div>
                  )}
                </div>

                {(selectedProduct.gallery?.length ?? 0) > 1 && (
                  <div className={styles.imageGallery}>
                    {(selectedProduct.gallery || []).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`${styles.galleryThumb} ${index === currentImageIndex ? styles.active : ""}`}
                      >
                        <img
                          src={image}
                          alt={`${selectedProduct.name} ${index + 1}`}
                          onError={handleImageError}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Section - Product Details */}
              <div className={styles.modalInfoSection}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalCategory}>
                    {selectedProduct.category}
                  </div>
                  <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
                  <div className={styles.modalRating}>
                    <div className={styles.stars}>
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < Math.floor(selectedProduct.rating)
                              ? styles.starFilled
                              : styles.star
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className={styles.ratingText}>
                      {selectedProduct.rating} ({selectedProduct.reviews}{" "}
                      reviews)
                    </span>
                  </div>
                </div>

                <div className={styles.modalDescription}>
                  <p>{selectedProduct.description}</p>
                </div>

                <div className={styles.modalTags}>
                  {(selectedProduct.tags || []).map((tag, index) => (
                    <span key={index} className={styles.modalTag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className={styles.modalPriceSection}>
                  <div className={styles.modalPriceContainer}>
                    {selectedProduct.originalPrice && (
                      <span className={styles.modalOriginalPrice}>
                        {formatPrice(selectedProduct.originalPrice)}
                      </span>
                    )}
                    <span className={styles.modalCurrentPrice}>
                      {formatPrice(selectedProduct.price)}
                    </span>
                  </div>
                  <div className={styles.modalStock}>
                    <span
                      className={`${styles.stockIndicator} ${selectedProduct.inStock ? styles.inStock : styles.outOfStock}`}
                    >
                      {selectedProduct.inStock
                        ? `✓ En stock (${selectedProduct.stockCount})`
                        : "✗ Sin stock"}
                    </span>
                  </div>
                </div>

                <div className={styles.modalSpecifications}>
                  <h4 className={styles.specsTitle}>
                    Especificaciones Técnicas
                  </h4>
                  {Object.keys(selectedProduct.specifications || {}).length >
                  0 ? (
                    <div className={styles.modalSpecList}>
                      {Object.entries(selectedProduct.specifications || {}).map(
                        ([key, value]) => (
                          <div key={key} className={styles.modalSpecItem}>
                            <span className={styles.modalSpecKey}>{key}</span>
                            <span className={styles.modalSpecValue}>
                              {value}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                      Este producto no tiene especificaciones técnicas.
                    </p>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <div className={styles.modalQuantitySection}>
                    <label className={styles.quantityLabel}>Cantidad:</label>
                    <div className={styles.modalQuantitySelector}>
                      <button
                        className={styles.modalQuantityBtn}
                        onClick={() =>
                          setModalQuantity(Math.max(1, modalQuantity - 1))
                        }
                        disabled={modalQuantity <= 1}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                      <span className={styles.modalQuantityDisplay}>
                        {modalQuantity}
                      </span>
                      <button
                        className={styles.modalQuantityBtn}
                        onClick={() =>
                          setModalQuantity(
                            Math.min(
                              selectedProduct.stockCount,
                              modalQuantity + 1,
                            ),
                          )
                        }
                        disabled={modalQuantity >= selectedProduct.stockCount}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      className={`${styles.modalAddToCart} ${isAddingToCart ? styles.loading : ""}`}
                      onClick={() => {
                        setIsAddingToCart(true);
                        setTimeout(() => {
                          addToCart(selectedProduct, modalQuantity);
                          setIsAddingToCart(false);
                          setShowMiniCart(true);
                          closeProductModal();
                        }, 1000);
                      }}
                      disabled={isAddingToCart || !selectedProduct.inStock}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                      <span>
                        {isAddingToCart
                          ? "Agregando..."
                          : `Agregar ${modalQuantity} al carrito`}
                      </span>
                    </button>

                    <button
                      className={`${styles.modalContactExpert} ${isContactingExpert ? styles.loading : ""}`}
                      onClick={() => {
                        if (selectedProduct) {
                          setIsContactingExpert(true);
                          handleProductConsult(selectedProduct);
                          setTimeout(() => {
                            setIsContactingExpert(false);
                          }, 1000);
                        }
                      }}
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
                          ? "Contactando..."
                          : "Consultar Experto"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ventas por Mayor */}
      <AnimatePresence>
        {showWholesaleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWholesaleModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0E4E4E',
                marginBottom: '0.5rem',
                fontFamily: '"Playfair Display", serif',
              }}>
                Ventas por Mayor
              </h3>
              <p style={{
                color: '#555',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
              }}>
                ¿Tenés un emprendimiento o negocio? En <strong>Arcoiris Joyería</strong> ofrecemos
                precios especiales para compras por mayor. Contactá a nuestro equipo para recibir
                catálogo exclusivo, precios diferenciados y condiciones de envío.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWholesaleContact}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #0E4E4E, #1a6b6b)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  📲 Contactar por WhatsApp
                </motion.button>
                <button
                  onClick={() => setShowWholesaleModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    color: '#888',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buscador Flotante */}
      {showFloatingSearch && (
        <div
          className={`${styles.floatingSearch} ${showFloatingSearch ? styles.visible : ""}`}
        >
          <div className={styles.floatingSearchContainer}>
            <div className={styles.floatingSearchBar}>
              <svg
                className={styles.floatingSearchIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Buscar joyas, anillos, collares..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    scrollToProducts();
                  }
                }}
                className={styles.floatingSearchInput}
              />
              {searchTerm && (
                <button
                  className={styles.floatingSearchClear}
                  onClick={() => setSearchTerm("")}
                  aria-label="Limpiar búsqueda"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ShopSection;
