import React, { useState, useEffect } from "react";
import {
  Product,
  Category,
  CreateProductData,
  CreateCategoryData,
} from "../../../../types/shop";
import { useProductMutations } from "../../../../hooks/useProducts";
import { useCategoryMutations } from "../../../../hooks/useCategories";
import { productService } from "../../../../services/productService";
import { ImageSlotsManager } from "../../../admin/ImageSlotsManager";
import styles from "./AdminModals.module.css";

interface AdminModalsPremiumProps {
  type: string;
  product?: Product | null;
  category?: Category | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export const AdminModalsPremium: React.FC<AdminModalsPremiumProps> = ({
  type,
  product,
  category,
  categories,
  onClose,
  onSave,
}) => {
  // Función para verificar si una categoría es hoja (no tiene subcategorías)
  const isLeafCategory = (categoryId: string): boolean => {
    return !categories.some((cat) => {
      const parentId = cat.parentCategoryId;
      if (typeof parentId === "object" && parentId !== null) {
        const parentObj = parentId as any;
        return (parentObj._id || parentObj.id) === categoryId;
      }
      return parentId === categoryId;
    });
  };

  // Filtrar solo categorías hoja para selección de productos
  const leafCategories = categories.filter((cat) => {
    const categoryId = cat._id || cat.id;
    return categoryId ? isLeafCategory(categoryId) : false;
  });

  // Hook para manejar mutaciones de categorías
  const {
    createProduct,
    updateProduct,
    deleteProduct,
    loading: productLoading,
    error: productError,
  } = useProductMutations();

  const {
    createCategory,
    updateCategory,
    deleteCategory,
    loading: categoryLoading,
    error: categoryError,
  } = useCategoryMutations();

  // Estados para formularios
  const [productForm, setProductForm] = useState({
    managementId: undefined as number | undefined,
    name: "",
    description: "",
    price: 0,
    originalPrice: 0,
    category: "",
    categoryId: "",
    stockCount: 0,
    rating: 0,
    featured: false,
    inStock: true,
    tags: [] as string[],
    specifications: {} as Record<string, string>,
    reviews: 0,
    discount: 0,
    gallery: [] as string[],
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "📦",
    color: "from-green-400 to-green-600",
    parentCategoryId: "",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [useSlotSystem, setUseSlotSystem] = useState(true); // Nuevo estado para controlar el sistema de slots

  // Función auxiliar para extraer ID de categoría de forma segura
  const extractCategoryId = (categoryId: any): string => {
    if (typeof categoryId === "string") {
      return categoryId;
    }
    if (typeof categoryId === "object" && categoryId !== null) {
      return categoryId._id || categoryId.id?.toString() || "";
    }
    return "";
  };

  // Función auxiliar para extraer ID de producto de forma segura
  const extractProductId = (product: any): string => {
    if (!product) return "";

    console.log("🔍 Debug product ID extraction:", {
      product_id: product.id,
      product_mongoId: product._id,
      product_managementId: product.managementId,
      full_product: product,
    });

    // Si el _id empieza con "temp_", es un placeholder - usar managementId
    if (product._id && product._id.startsWith("temp_")) {
      console.log(
        "⚠️ Placeholder product detected, using managementId for search",
      );
      return product.managementId?.toString() || product.id?.toString() || "";
    }

    // Para productos reales, priorizar _id (MongoDB) sobre id (numérico para UI)
    const id = product._id || (product.id ? product.id.toString() : "");
    console.log("🆔 Extracted product ID:", id);
    return id;
  };

  // Función para eliminar producto por managementId cuando no tenemos ObjectId válido
  const deleteProductByManagementId = async (
    managementId: number,
    authToken: string,
  ): Promise<boolean> => {
    try {
      console.log(
        "🔍 Searching and deleting product by managementId:",
        managementId,
      );

      // Estrategia 1: Buscar por texto (managementId como string)
      console.log("📋 Strategy 1: Searching by managementId as text");
      let searchResults = await productService.getAllProducts({
        search: managementId.toString(),
      });

      let realProduct = searchResults.find(
        (p: any) => p.managementId === managementId,
      );

      if (!realProduct) {
        console.log("📋 Strategy 2: Searching by ID field");
        // Estrategia 2: Buscar productos con ID numérico igual
        realProduct = searchResults.find(
          (p: any) =>
            p.id === managementId ||
            (p._id && parseInt(p._id, 10) === managementId),
        );
      }

      if (!realProduct) {
        console.log("📋 Strategy 3: Getting all products and filtering");
        // Estrategia 3: Obtener todos los productos y filtrar
        try {
          const allProducts = await productService.getAllProducts({
            limit: 1000, // Obtener un número alto de productos
          });

          realProduct = allProducts.find(
            (p: any) =>
              p.managementId === managementId ||
              p.id === managementId ||
              (p._id && parseInt(p._id, 10) === managementId),
          );

          console.log("🔍 Total products searched:", allProducts.length);
          console.log("🔍 Looking for managementId:", managementId);
          console.log(
            "🔍 Sample products with their IDs:",
            allProducts.slice(0, 5).map((p) => ({
              name: p.name,
              id: p.id,
              managementId: p.managementId,
              _id: p._id,
            })),
          );

          // Verificar si existe algún producto con ID similar
          const similarProducts = allProducts.filter((p: any) => {
            const idStr = managementId.toString();
            return (
              (p.managementId && p.managementId.toString().includes(idStr)) ||
              (p.id && p.id.toString().includes(idStr)) ||
              (p._id && p._id.includes(idStr))
            );
          });

          if (similarProducts.length > 0) {
            console.log(
              "🔍 Found products with similar IDs:",
              similarProducts.map((p) => ({
                name: p.name,
                id: p.id,
                managementId: p.managementId,
                _id: p._id,
              })),
            );
          }
        } catch (error) {
          console.error("❌ Error in strategy 3:", error);
        }
      }

      if (!realProduct) {
        console.error("❌ Product not found with any strategy");
        console.log("❌ Detailed search summary:");
        console.log(`   - Looking for ID: ${managementId}`);
        console.log(
          `   - Search by text returned: ${searchResults.length} results`,
        );
        console.log(`   - No exact matches found in any strategy`);

        throw new Error(
          `PRODUCTO NO ENCONTRADO:\n\n` +
            `ID buscado: ${managementId}\n` +
            `El producto no existe en el servidor.\n\n` +
            `Posibles causas:\n` +
            `• Ya fue eliminado por otro administrador\n` +
            `• Hay una inconsistencia entre datos locales y del servidor\n` +
            `• El producto fue modificado externamente\n\n` +
            `SOLUCIÓN: Los datos se refrescarán automáticamente.`,
        );
      }

      console.log("✅ Real product found:", realProduct);

      // Eliminar usando el ObjectId real
      const realProductId = realProduct._id || realProduct.id?.toString();
      if (!realProductId) {
        throw new Error("El producto encontrado no tiene un ID válido");
      }

      console.log("🗑️ Deleting with real ObjectId:", realProductId);
      await productService.deleteProduct(realProductId, false, authToken);

      return true;
    } catch (error) {
      console.error("❌ Error deleting by managementId:", error);
      throw error;
    }
  };

  // Efectos para inicializar formularios
  useEffect(() => {
    if (type === "edit-product" && product) {
      setProductForm({
        managementId: product.managementId,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice || 0,
        category: product.category,
        categoryId: extractCategoryId(product.categoryId),
        stockCount: product.stockCount,
        rating: product.rating,
        featured: product.featured,
        inStock: product.inStock,
        tags: [...product.tags],
        specifications: { ...product.specifications },
        reviews: product.reviews,
        discount: product.discount || 0,
        gallery: product.gallery
          ? [...product.gallery]
          : ["/uploads/products/default-product.png"],
      });

      // Set image previews from existing product
      if (product.gallery && product.gallery.length > 0) {
        setImagePreviews([...product.gallery]);
      } else if (product.image) {
        setImagePreviews([product.image]);
      }
    } else if (type === "add-product") {
      // Reset form for new product
      setProductForm({
        managementId: undefined,
        name: "",
        description: "",
        price: 0,
        originalPrice: 0,
        category: "",
        categoryId: "",
        stockCount: 0,
        rating: 0,
        featured: false,
        inStock: true,
        tags: [],
        specifications: {},
        reviews: 0,
        discount: 0,
        gallery: ["/uploads/products/default-product.png"],
      });
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [type, product]);

  useEffect(() => {
    if (type === "edit-category" && category) {
      setCategoryForm({
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color || "from-green-400 to-green-600",
        // Normalizar parentCategoryId: puede venir como objeto poblado o string
        parentCategoryId: extractCategoryId(category.parentCategoryId) || "",
      });
    } else if (type === "add-category") {
      setCategoryForm({
        name: "",
        description: "",
        icon: "📦",
        color: "from-green-400 to-green-600",
        parentCategoryId: "",
      });
    }
  }, [type, category]);

  // Funciones para manejo de notificaciones
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage("");
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      setTimeout(() => setSuccessMessage(""), 300); // Delay para animación
    }, 4000); // Aumentado a 4 segundos para mayor visibilidad
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage("");
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      setTimeout(() => setErrorMessage(""), 300); // Delay para animación
    }, 6000); // Aumentado a 6 segundos para errores
  };

  // Manejadores de eventos para productos
  const handleProductInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type: inputType } = e.target;

    setProductForm((prev) => {
      const newForm = {
        ...prev,
        [name]:
          inputType === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : inputType === "number"
              ? parseFloat(value) || 0
              : value,
      };

      // Si se cambia la categoría, también actualizar el nombre de la categoría
      if (name === "categoryId" && value) {
        const selectedCategory = categories.find(
          (cat) => (cat._id || cat.id?.toString()) === value,
        );
        if (selectedCategory) {
          newForm.category = selectedCategory.name;
        }
      }

      return newForm;
    });
  };

  const handleCategoryInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 6) {
      setErrorMessage("Máximo 6 imágenes permitidas");
      return;
    }

    setImageFiles(files);

    // Create previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    setErrorMessage("");
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke URL for removed preview
    if (imagePreviews[index] && imagePreviews[index].startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const addTag = () => {
    if (tagInput.trim() && !productForm.tags.includes(tagInput.trim())) {
      setProductForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProductForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setProductForm((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim(),
        },
      }));
      setSpecKey("");
      setSpecValue("");
    }
  };

  const removeSpecification = (keyToRemove: string) => {
    setProductForm((prev) => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[keyToRemove];
      return { ...prev, specifications: newSpecs };
    });
  };

  const handleSaveProduct = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      // Validation
      if (!productForm.name.trim()) {
        showErrorMessage("El nombre del producto es requerido");
        return;
      }

      if (!productForm.description.trim()) {
        showErrorMessage("La descripción del producto es requerida");
        return;
      }

      if (!productForm.categoryId) {
        showErrorMessage("Debe seleccionar una categoría");
        return;
      }

      // Validar que la categoría seleccionada sea hoja (no tenga subcategorías)
      const selectedCategoryId = extractCategoryId(productForm.categoryId);
      if (!isLeafCategory(selectedCategoryId)) {
        showErrorMessage(
          "⚠️ No se pueden agregar productos a categorías padre. " +
            "Solo las categorías finales (sin subcategorías) pueden contener productos. " +
            "Por favor, selecciona una subcategoría.",
        );
        return;
      }

      if (productForm.price <= 0) {
        showErrorMessage("El precio debe ser mayor a 0");
        return;
      }

      // Mostrar mensaje de carga si hay imágenes
      if (imageFiles.length > 0) {
        showSuccessMessage("📸 Subiendo imágenes...");
      }

      // Create product data object
      console.log("🔍 Debug categoryId:", {
        original: productForm.categoryId,
        type: typeof productForm.categoryId,
        extracted: extractCategoryId(productForm.categoryId),
      });

      const productData: CreateProductData = {
        managementId: productForm.managementId,
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        category: productForm.category,
        categoryId: extractCategoryId(productForm.categoryId),
        stockCount: productForm.stockCount,
        featured: productForm.featured,
        originalPrice:
          productForm.originalPrice > 0 ? productForm.originalPrice : undefined,
        tags: productForm.tags,
        specifications: productForm.specifications,
        rating: productForm.rating,
        reviews: productForm.reviews,
        // Solo incluir gallery para productos nuevos, no para edición
        ...(type === "add-product" && { gallery: productForm.gallery }),
      };

      // Obtener el token del usuario autenticado desde localStorage
      const getUserToken = () => {
        try {
          const userData = localStorage.getItem("userData");
          if (userData) {
            const user = JSON.parse(userData);

            // Verificar que el usuario sea admin
            if (!user.isAdmin) {
              throw new Error(
                "No tienes permisos de administrador para realizar esta acción.",
              );
            }

            return user.token;
          }
        } catch (error) {
          console.error("Error getting user token:", error);
          throw error;
        }
        return null;
      };

      const authToken = getUserToken();

      if (!authToken) {
        throw new Error(
          "No se encontró token de autenticación. Por favor, inicia sesión como administrador.",
        );
      }

      if (type === "edit-product" && product) {
        const productId = extractProductId(product);
        if (!productId) {
          throw new Error("No se pudo obtener el ID del producto");
        }

        console.log("🔍 DEBUG: Editing product with images:", {
          productId,
          originalGallery: product.gallery,
          imageFilesLength: imageFiles.length,
          imagePreviews: imagePreviews,
          productData: productData,
        });

        // Solo enviar archivos de imagen si se han seleccionado nuevas imágenes
        const filesToUpload = imageFiles.length > 0 ? imageFiles : undefined;

        console.log("🔍 DEBUG: Files to upload:", filesToUpload);

        await updateProduct(productId, productData, filesToUpload, authToken);
        showSuccessMessage(
          `✅ Producto "${productData.name}" actualizado exitosamente`,
        );
      } else if (type === "add-product") {
        await createProduct(productData, imageFiles, authToken);
        showSuccessMessage(
          `🎉 Producto "${productData.name}" creado exitosamente`,
        );
      }

      onSave();

      // Cerrar modal después de mostrar éxito (delay para que se vea la notificación)
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving product:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Error al guardar el producto";
      showErrorMessage(errorMsg);
    }
  };

  const handleSaveCategory = async () => {
    try {
      console.log("🚀 Iniciando creación de categoría...");
      console.log("🔍 Tipo de modal:", type);
      setErrorMessage("");
      setSuccessMessage("");

      // Validation
      if (!categoryForm.name.trim()) {
        showErrorMessage("El nombre de la categoría es requerido");
        return;
      }

      if (!categoryForm.description.trim()) {
        showErrorMessage("La descripción de la categoría es requerida");
        return;
      }

      // Base de datos para categoría (común a create/update)
      const baseCategoryData = {
        name: categoryForm.name,
        description: categoryForm.description,
        icon: categoryForm.icon,
        color: categoryForm.color,
      };

      // Normalizar parentCategoryId según operación:
      // - Crear: enviar undefined si está vacío (raíz), o string id si existe
      // - Editar: enviar null si está vacío para limpiar el padre en backend
      const parentIdRaw = categoryForm.parentCategoryId;
      const normalizedParentForCreate = parentIdRaw
        ? extractCategoryId(parentIdRaw)
        : undefined;
      const normalizedParentForUpdate =
        parentIdRaw === "" ? null : extractCategoryId(parentIdRaw) || undefined;

      // Nota: CreateCategoryData tipa parentCategoryId como string|undefined; para update
      // necesitamos poder enviar null para limpiar. Lo resolvemos creando los objetos
      // por separado según la operación.

      // Obtener el token del usuario autenticado desde localStorage
      const getUserToken = () => {
        try {
          const userData = localStorage.getItem("userData");
          if (userData) {
            const user = JSON.parse(userData);

            // Verificar que el usuario sea admin
            if (!user.isAdmin) {
              throw new Error(
                "No tienes permisos de administrador para realizar esta acción.",
              );
            }

            return user.token;
          }
        } catch (error) {
          console.error("Error getting user token:", error);
          throw error;
        }
        return null;
      };

      const authToken = getUserToken();

      if (!authToken) {
        throw new Error(
          "No se encontró token de autenticación. Por favor, inicia sesión como administrador.",
        );
      }

      console.log(
        "🔑 Token obtenido para autenticación:",
        authToken ? "✓ Token presente" : "✗ Token faltante",
      );

      if (type === "edit-category" && category) {
        console.log("✏️ Editando categoría existente...");
        const categoryId = category._id || category.id?.toString();
        if (!categoryId) {
          throw new Error("No se pudo obtener el ID de la categoría");
        }
        const updateData = {
          ...baseCategoryData,
          // Enviar null explícito para limpiar el padre cuando corresponde
          parentCategoryId: normalizedParentForUpdate as unknown as
            | string
            | undefined,
        } as Partial<CreateCategoryData> as any;

        console.log("📝 Datos de categoría (UPDATE) a enviar:", updateData);
        await updateCategory(categoryId, updateData, authToken);
        console.log("✅ Categoría actualizada exitosamente");
        showSuccessMessage(
          `✅ Categoría "${baseCategoryData.name}" actualizada exitosamente`,
        );
      } else if (type === "add-category") {
        console.log("➕ Creando nueva categoría...");
        const createData: CreateCategoryData = {
          ...baseCategoryData,
          parentCategoryId: normalizedParentForCreate,
        };

        console.log("📝 Datos de categoría (CREATE) a enviar:", createData);
        const result = await createCategory(createData, authToken);
        if (result) {
          console.log("✅ Categoría creada exitosamente:", result);
          showSuccessMessage(
            `🎉 Categoría "${baseCategoryData.name}" creada exitosamente`,
          );
        } else {
          console.log("❌ No se pudo crear la categoría - resultado null");
          throw new Error("No se pudo crear la categoría");
        }
      } else {
        console.log("⚠️ Tipo de operación no reconocido:", type);
        throw new Error("Tipo de operación no válido");
      }

      // Llamar onSave para refrescar la lista en el componente padre
      console.log("🔄 Ejecutando onSave para refrescar datos...");
      onSave();

      // Cerrar modal después de mostrar éxito (delay para que se vea la notificación)
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("❌ Error al guardar categoría:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Error al guardar la categoría";
      showErrorMessage(errorMsg);
    }
  };

  const handleDeleteCategory = async (deleteProducts: boolean = false) => {
    try {
      console.log("🗑️ Iniciando eliminación de categoría...");
      setErrorMessage("");
      setSuccessMessage("");

      if (!category) {
        throw new Error("No se encontró la categoría a eliminar");
      }

      // Obtener el token del usuario autenticado desde localStorage
      const getUserToken = () => {
        try {
          const userData = localStorage.getItem("userData");
          if (userData) {
            const user = JSON.parse(userData);

            // Verificar que el usuario sea admin
            if (!user.isAdmin) {
              throw new Error(
                "No tienes permisos de administrador para realizar esta acción.",
              );
            }

            return user.token;
          }
        } catch (error) {
          console.error("Error getting user token:", error);
          throw error;
        }
        return null;
      };

      const authToken = getUserToken();

      if (!authToken) {
        throw new Error(
          "No se encontró token de autenticación. Por favor, inicia sesión como administrador.",
        );
      }

      console.log(
        "🔑 Token obtenido para autenticación:",
        authToken ? "✓ Token presente" : "✗ Token faltante",
      );

      const categoryId = category._id || category.id?.toString();
      if (!categoryId) {
        throw new Error("No se pudo obtener el ID de la categoría");
      }

      console.log(`🗑️ Eliminando categoría ${categoryId}...`);
      console.log(`📦 Eliminar productos asociados: ${deleteProducts}`);

      const result = await deleteCategory(
        categoryId,
        deleteProducts,
        authToken,
      );

      if (result) {
        console.log("✅ Categoría eliminada exitosamente");
        showSuccessMessage(
          `🗑️ Categoría "${category.name}" eliminada exitosamente`,
        );

        // Llamar onSave para refrescar la lista en el componente padre
        console.log("🔄 Ejecutando onSave para refrescar datos...");
        onSave();

        // Cerrar modal después de mostrar éxito (delay para que se vea la notificación)
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error("No se pudo eliminar la categoría");
      }
    } catch (error) {
      console.error("❌ Error al eliminar categoría:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Error al eliminar la categoría";
      showErrorMessage(errorMsg);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      console.log("� Starting handleDeleteProduct...");
      console.log("📦 Product object received:", product);

      setErrorMessage("");
      setSuccessMessage("");

      if (!product) {
        throw new Error("No se encontró el producto a eliminar");
      }

      // Obtener el token del usuario autenticado desde localStorage
      const getUserToken = () => {
        try {
          const userData = localStorage.getItem("userData");
          if (userData) {
            const user = JSON.parse(userData);

            // Verificar que el usuario sea admin
            if (!user.isAdmin) {
              throw new Error(
                "No tienes permisos de administrador para realizar esta acción.",
              );
            }

            return user.token;
          }
        } catch (error) {
          console.error("Error getting user token:", error);
          throw error;
        }
        return null;
      };

      const authToken = getUserToken();

      if (!authToken) {
        throw new Error(
          "No se encontró token de autenticación. Por favor, inicia sesión como administrador.",
        );
      }

      console.log(
        "🔑 Token obtenido para autenticación:",
        authToken ? "✓ Token presente" : "✗ Token faltante",
      );

      console.log("🔍 About to extract product ID from:", product);
      const productId = extractProductId(product);
      console.log("✅ Product ID extracted:", productId);

      if (!productId) {
        throw new Error("No se pudo obtener el ID del producto");
      }

      console.log(`🗑️ Eliminando producto ${productId}...`);

      let result;

      // Si el producto es un placeholder (temp_), usar managementId para buscarlo
      if (
        product._id &&
        product._id.startsWith("temp_") &&
        product.managementId
      ) {
        console.log(
          "🔄 Using managementId deletion method for placeholder product",
        );
        try {
          result = await deleteProductByManagementId(
            product.managementId,
            authToken,
          );
        } catch (managementIdError) {
          // Si falla la eliminación por managementId, ofrecer continuar de todos modos
          console.warn(
            "⚠️ Product deletion by managementId failed:",
            managementIdError,
          );

          const errorMessage =
            managementIdError instanceof Error
              ? managementIdError.message
              : "Error desconocido";

          // Si el error indica que no se encontró el producto, tratar como eliminación exitosa
          if (
            errorMessage.includes("PRODUCTO NO ENCONTRADO") ||
            errorMessage.includes("No se pudo encontrar")
          ) {
            console.log(
              "🔄 Treating as successful deletion - product likely already deleted",
            );

            // Cerrar modal inmediatamente y refrescar datos
            onSave();

            showSuccessMessage(
              `✅ El producto fue procesado exitosamente.\n\n` +
                `Nota: El producto no se encontró en el servidor, ` +
                `posiblemente ya fue eliminado por otro administrador. ` +
                `Los datos se han refrescado automáticamente.`,
            );

            return; // Salir de la función para evitar mostrar error
          } else {
            // Para otros errores, mostrar el error completo
            showErrorMessage(
              `❌ Error al eliminar producto:\n\n${errorMessage}`,
            );
            throw managementIdError;
          }
        }
      } else {
        console.log("🔄 Using standard deletion method");
        result = await deleteProduct(productId, false, authToken);
      }

      if (result) {
        console.log("✅ Producto eliminado exitosamente");
        showSuccessMessage(
          `🗑️ Producto "${product.name}" eliminado exitosamente`,
        );

        // Llamar onSave para refrescar la lista en el componente padre
        console.log("🔄 Ejecutando onSave para refrescar datos...");
        onSave();

        // Cerrar modal después de mostrar éxito (delay para que se vea la notificación)
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error("No se pudo eliminar el producto");
      }
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Error al eliminar el producto";
      showErrorMessage(errorMsg);
    }
  };

  // Cleanup de URLs cuando se desmonta el componente
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []);

  const renderProductModal = () => (
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>
          {type === "edit-product" ? "Editar Producto" : "Agregar Producto"}
        </h2>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      </div>

      <div className={styles.modalBody}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Producto Id (Opcional)</label>
          <input
            type="number"
            name="managementId"
            value={productForm.managementId || ""}
            onChange={handleProductInputChange}
            placeholder="Ingrese el Id del producto de Río Gestión"
            className={styles.input}
            min="1"
          />
          <small className={styles.helpText}>
            Identificador asignado en Río Gestión (opcional)
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nombre del Producto</label>
          <input
            type="text"
            name="name"
            value={productForm.name}
            onChange={handleProductInputChange}
            placeholder="Ingrese el nombre del producto"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Descripción</label>
          <textarea
            name="description"
            value={productForm.description}
            onChange={handleProductInputChange}
            placeholder="Ingrese la descripción del producto"
            rows={4}
            className={styles.textarea}
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Precio</label>
            <input
              type="number"
              name="price"
              value={productForm.price}
              onChange={handleProductInputChange}
              min="0"
              step="0.01"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Precio Original (opcional)</label>
            <input
              type="number"
              name="originalPrice"
              value={productForm.originalPrice}
              onChange={handleProductInputChange}
              min="0"
              step="0.01"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Descuento (%)</label>
            <input
              type="number"
              name="discount"
              value={productForm.discount}
              onChange={handleProductInputChange}
              min="0"
              max="100"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Categoría
              <span className={styles.helpText}>
                (Solo categorías finales - sin subcategorías)
              </span>
            </label>
            <select
              name="categoryId"
              value={productForm.categoryId}
              onChange={handleProductInputChange}
              className={styles.select}
              required
            >
              <option value="">Seleccionar categoría</option>
              {leafCategories.length > 0 ? (
                leafCategories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.icon} {cat.name}
                    {cat.parentCategoryId && (
                      <span className={styles.categoryPath}>
                        {" "}
                        -{" "}
                        {
                          categories.find((parent) => {
                            const parentId = cat.parentCategoryId;
                            if (
                              typeof parentId === "object" &&
                              parentId !== null
                            ) {
                              const parentObj = parentId as any;
                              return (
                                (parent._id || parent.id) ===
                                (parentObj._id || parentObj.id)
                              );
                            }
                            return (parent._id || parent.id) === parentId;
                          })?.name
                        }
                      </span>
                    )}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No hay categorías finales disponibles. Crea subcategorías
                  primero.
                </option>
              )}
            </select>
            {leafCategories.length === 0 && (
              <div className={styles.warningMessage}>
                ⚠️ Para agregar productos, primero debes crear categorías que no
                tengan subcategorías. Las categorías padre no pueden contener
                productos directamente.
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Stock</label>
            <input
              type="number"
              name="stockCount"
              value={productForm.stockCount}
              onChange={handleProductInputChange}
              min="0"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Rating (1-5)</label>
            <input
              type="number"
              name="rating"
              value={productForm.rating}
              onChange={handleProductInputChange}
              min="0"
              max="5"
              step="0.1"
              className={styles.input}
              placeholder="4.5"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Número de Reviews</label>
            <input
              type="number"
              name="reviews"
              value={productForm.reviews}
              onChange={handleProductInputChange}
              min="0"
              className={styles.input}
              placeholder="12"
            />
          </div>
        </div>

        <div className={styles.checkboxGroup}>
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="featured"
                checked={productForm.featured}
                onChange={handleProductInputChange}
                className={styles.checkbox}
              />
              Producto Destacado
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="inStock"
                checked={productForm.inStock}
                onChange={handleProductInputChange}
                className={styles.checkbox}
              />
              En Stock
            </label>
          </div>
        </div>

        {/* Sistema de Gestión de Imágenes */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Gestión de Imágenes del Producto
          </label>

          {/* Toggle para elegir entre sistema nuevo y viejo */}
          <div className={styles.systemToggle}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={useSlotSystem}
                onChange={(e) => setUseSlotSystem(e.target.checked)}
                className={styles.checkbox}
              />
              Usar sistema avanzado de slots (recomendado)
            </label>
          </div>

          {useSlotSystem ? (
            // Nuevo sistema de slots
            <div className={styles.slotsContainer}>
              {product && (product._id || product.id) ? (
                <ImageSlotsManager
                  productId={String(product._id || product.id || "")}
                  onImagesUpdate={(gallery) => {
                    setProductForm((prev) => ({
                      ...prev,
                      gallery: gallery,
                    }));
                  }}
                  onPrimaryImageChange={(imageUrl) => {
                    // Actualizar imagen principal si es necesario
                    console.log("Primary image changed:", imageUrl);
                  }}
                />
              ) : (
                <div className={styles.slotSystemInfo}>
                  <div className={styles.infoIcon}>💡</div>
                  <div className={styles.infoText}>
                    <strong>
                      Sistema de slots disponible después de crear el producto
                    </strong>
                    <p>
                      Una vez que guardes el producto, podrás usar el sistema
                      avanzado de gestión de imágenes con 6 slots individuales,
                      drag & drop y control granular.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Sistema tradicional de imágenes
            <div className={styles.traditionalImageSystem}>
              <label className={styles.subLabel}>
                Imágenes del Producto (máximo 6)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className={styles.input}
              />

              {imagePreviews.length > 0 && (
                <div className={styles.imagePreviewGrid}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className={styles.imagePreview}>
                      <img src={preview} alt={`Preview ${index}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className={styles.removeButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Etiquetas</label>
          <div className={styles.arrayItem}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Agregar etiqueta"
              className={styles.input}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button type="button" onClick={addTag} className={styles.addButton}>
              Agregar
            </button>
          </div>

          {productForm.tags.length > 0 && (
            <div className={styles.tagsList}>
              {productForm.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className={styles.removeButton}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Especificaciones */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Especificaciones</label>
          <div className={styles.specForm}>
            <input
              type="text"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              placeholder="Clave (ej: Peso)"
              className={styles.input}
            />
            <input
              type="text"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              placeholder="Valor (ej: 500g)"
              className={styles.input}
            />
            <button
              type="button"
              onClick={addSpecification}
              className={styles.addButton}
            >
              Agregar
            </button>
          </div>

          {Object.entries(productForm.specifications).length > 0 && (
            <div className={styles.specList}>
              {Object.entries(productForm.specifications).map(
                ([key, value]) => (
                  <div key={key} className={styles.specItem}>
                    <span className={styles.specKey}>
                      <strong>{key}:</strong>
                    </span>
                    <span className={styles.specValue}>{value}</span>
                    <button
                      type="button"
                      onClick={() => removeSpecification(key)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {(errorMessage || productError) && (
          <div className={styles.errorMessage}>
            {errorMessage || productError}
          </div>
        )}
      </div>

      <div className={styles.modalFooter}>
        <button onClick={onClose} className={styles.cancelButton}>
          Cancelar
        </button>
        <button
          onClick={handleSaveProduct}
          className={styles.saveButton}
          disabled={productLoading}
        >
          {productLoading ? "Guardando..." : "Guardar Producto"}
        </button>
      </div>
    </div>
  );

  const renderCategoryModal = () => (
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>
          {type === "edit-category" ? "Editar Categoría" : "Agregar Categoría"}
        </h2>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      </div>

      <div className={styles.modalBody}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Nombre de la Categoría</label>
          <input
            type="text"
            name="name"
            value={categoryForm.name}
            onChange={handleCategoryInputChange}
            placeholder="Ingrese el nombre de la categoría"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Categoría Padre (Opcional)</label>
          <select
            name="parentCategoryId"
            value={categoryForm.parentCategoryId}
            onChange={handleCategoryInputChange}
            className={styles.input}
          >
            <option value="">
              -- Sin categoría padre (Categoría principal) --
            </option>
            {categories
              .filter((cat) => {
                const catId = cat._id || cat.id;
                const currentCatId = category?._id || category?.id;
                // Excluir la categoría actual para evitar auto-referencia
                return catId !== currentCatId;
              })
              .map((cat) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
          <small className={styles.helpText}>
            Selecciona una categoría padre para crear una subcategoría. Deja
            vacío para crear una categoría principal.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Descripción</label>
          <textarea
            name="description"
            value={categoryForm.description}
            onChange={handleCategoryInputChange}
            placeholder="Ingrese la descripción de la categoría"
            rows={3}
            className={styles.textarea}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Icono</label>
          <input
            type="text"
            name="icon"
            value={categoryForm.icon}
            onChange={handleCategoryInputChange}
            placeholder="Ingrese un emoji o icono"
            className={styles.input}
          />
          <small className={styles.helpText}>
            Puede usar emojis como: 🌱 🌿 💡 🔧 🌾 etc.
          </small>
        </div>

        {(errorMessage || categoryError) && (
          <div className={styles.errorMessage}>
            {errorMessage || categoryError}
          </div>
        )}
      </div>

      <div className={styles.modalFooter}>
        <button onClick={onClose} className={styles.cancelButton}>
          Cancelar
        </button>
        <button
          onClick={() => {
            console.log("🖱️ Botón Guardar Categoría clickeado");
            handleSaveCategory();
          }}
          className={styles.saveButton}
          disabled={categoryLoading}
        >
          {categoryLoading ? "Guardando..." : "Guardar Categoría"}
        </button>
      </div>
    </div>
  );

  const renderDeleteConfirmationModal = () => (
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>Confirmar Eliminación</h2>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      </div>

      <div className={styles.modalBody}>
        <div className={styles.deleteConfirmation}>
          <div className={styles.deleteIcon}>🗑️</div>
          <h3 className={styles.deleteTitle}>
            ¿Estás seguro de eliminar esta categoría?
          </h3>
          <p className={styles.deleteMessage}>
            <strong>{category?.name}</strong>
          </p>
          <p className={styles.deleteWarning}>
            Esta acción no se puede deshacer. Si la categoría tiene productos
            asociados, puedes elegir si eliminarlos también o cancelar la
            operación.
          </p>

          {category?.productCount && category.productCount > 0 && (
            <div className={styles.deleteOptions}>
              <div className={styles.deleteOptionWarning}>
                ⚠️ Esta categoría tiene{" "}
                <strong>{category.productCount} producto(s)</strong>{" "}
                asociado(s).
              </div>
            </div>
          )}
        </div>

        {(errorMessage || categoryError) && (
          <div className={styles.errorMessage}>
            {errorMessage || categoryError}
          </div>
        )}
      </div>

      <div className={styles.modalFooter}>
        <button onClick={onClose} className={styles.cancelButton}>
          Cancelar
        </button>
        {category?.productCount && category.productCount > 0 ? (
          <>
            <button
              onClick={() => handleDeleteCategory(false)}
              className={styles.deleteButton}
              disabled={categoryLoading}
            >
              {categoryLoading ? "Eliminando..." : "Eliminar Solo Categoría"}
            </button>
            <button
              onClick={() => handleDeleteCategory(true)}
              className={styles.dangerButton}
              disabled={categoryLoading}
            >
              {categoryLoading
                ? "Eliminando..."
                : "Eliminar Categoría y Productos"}
            </button>
          </>
        ) : (
          <button
            onClick={() => handleDeleteCategory(false)}
            className={styles.deleteButton}
            disabled={categoryLoading}
          >
            {categoryLoading ? "Eliminando..." : "Eliminar Categoría"}
          </button>
        )}
      </div>
    </div>
  );

  const renderDeleteProductConfirmationModal = () => (
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>Confirmar Eliminación</h2>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      </div>

      <div className={styles.modalBody}>
        <div className={styles.deleteConfirmation}>
          <div className={styles.deleteIcon}>🗑️</div>
          <h3 className={styles.deleteTitle}>
            ¿Estás seguro de eliminar este producto?
          </h3>
          <div className={styles.productDeleteInfo}>
            {(product?.image ||
              (product?.gallery && product.gallery.length > 0)) && (
              <div className={styles.productImagePreview}>
                <img
                  src={product.image || product.gallery?.[0]}
                  alt={product.name}
                  className={styles.deleteProductImage}
                />
              </div>
            )}
            <div className={styles.productDeleteDetails}>
              <p className={styles.deleteMessage}>
                <strong>{product?.name}</strong>
              </p>
              <p className={styles.productPrice}>
                Precio: <strong>${product?.price}</strong>
              </p>
              {product?.category && (
                <p className={styles.productCategory}>
                  Categoría: <strong>{product.category}</strong>
                </p>
              )}
            </div>
          </div>
          <p className={styles.deleteWarning}>
            Esta acción no se puede deshacer. El producto será eliminado
            permanentemente del sistema.
          </p>
        </div>

        {(errorMessage || productError) && (
          <div className={styles.errorMessage}>
            {errorMessage || productError}
          </div>
        )}
      </div>

      <div className={styles.modalFooter}>
        <button onClick={onClose} className={styles.cancelButton}>
          Cancelar
        </button>
        <button
          onClick={handleDeleteProduct}
          className={styles.deleteButton}
          disabled={productLoading}
        >
          {productLoading ? "Eliminando..." : "Eliminar Producto"}
        </button>
      </div>
    </div>
  );

  // Componente de notificación
  const renderNotification = () => {
    if (!showNotification || (!successMessage && !errorMessage)) return null;

    const isSuccess = !!successMessage;
    const message = isSuccess ? successMessage : errorMessage;

    return (
      <div
        className={`${styles.notification} ${
          isSuccess ? styles.notificationSuccess : styles.notificationError
        } ${showNotification ? styles.notificationShow : ""}`}
      >
        <div className={styles.notificationIcon}>{isSuccess ? "✅" : "❌"}</div>
        <div className={styles.notificationMessage}>{message}</div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>
          {type.includes("product") && type !== "delete-product"
            ? renderProductModal()
            : type === "delete-product"
              ? renderDeleteProductConfirmationModal()
              : type === "delete-category"
                ? renderDeleteConfirmationModal()
                : renderCategoryModal()}
        </div>
      </div>
      {renderNotification()}
    </>
  );
};
