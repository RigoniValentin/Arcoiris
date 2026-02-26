import { Category } from "../types/shop";

/**
 * Convierte una lista plana de categorías en una estructura jerárquica
 */
export function buildCategoryHierarchy(categories: Category[]): Category[] {
  // Crear un mapa para acceso rápido por ID
  const categoryMap = new Map<string, Category>();

  // Inicializar categorías con subcategorías vacías
  categories.forEach((category) => {
    const id = category._id || category.id;
    if (id) {
      categoryMap.set(id.toString(), {
        ...category,
        subcategories: [],
        level: 0,
        isParent: false,
      });
    }
  });

  // Organizar jerarquía y calcular niveles
  const rootCategories: Category[] = [];

  categories.forEach((category) => {
    const id = category._id || category.id;
    const mappedCategory = categoryMap.get(id!.toString());

    if (!mappedCategory) return;

    if (category.parentCategoryId) {
      // Es una subcategoría
      // Extraer el ID del parentCategoryId (puede ser string u objeto)
      let parentIdString: string;
      if (
        typeof category.parentCategoryId === "object" &&
        category.parentCategoryId !== null
      ) {
        const parentObj = category.parentCategoryId as any;
        parentIdString = parentObj._id || parentObj.id;
      } else {
        parentIdString = category.parentCategoryId as string;
      }

      const parent = categoryMap.get(parentIdString.toString());
      if (parent) {
        parent.subcategories!.push(mappedCategory);
        parent.isParent = true;
        mappedCategory.level = (parent.level || 0) + 1;
      } else {
        // Si no encuentra el padre, la pone en raíz
        rootCategories.push(mappedCategory);
      }
    } else {
      // Es una categoría raíz
      rootCategories.push(mappedCategory);
    }
  });

  return rootCategories;
}

/**
 * Obtiene todas las subcategorías de una categoría padre (recursivamente)
 */
export function getAllSubcategoryIds(category: Category): string[] {
  const ids: string[] = [];
  const categoryId = category._id || category.id;

  if (categoryId) {
    ids.push(categoryId.toString());
  }

  if (category.subcategories) {
    category.subcategories.forEach((subcategory) => {
      ids.push(...getAllSubcategoryIds(subcategory));
    });
  }

  return ids;
}

/**
 * Aplana una estructura jerárquica de categorías
 */
export function flattenCategoryHierarchy(categories: Category[]): Category[] {
  const flattened: Category[] = [];

  categories.forEach((category) => {
    flattened.push(category);
    if (category.subcategories) {
      flattened.push(...flattenCategoryHierarchy(category.subcategories));
    }
  });

  return flattened;
}

/**
 * Busca una categoría por ID en la estructura jerárquica
 */
export function findCategoryById(
  categories: Category[],
  id: string,
): Category | null {
  for (const category of categories) {
    const categoryId = category._id || category.id;
    if (categoryId?.toString() === id.toString()) {
      return category;
    }

    if (category.subcategories) {
      const found = findCategoryById(category.subcategories, id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Obtiene el path completo de una categoría (ej: "Iluminación > LED > Paneles")
 */
export function getCategoryPath(
  categories: Category[],
  targetId: string,
): string[] {
  function findPath(
    cats: Category[],
    target: string,
    currentPath: string[] = [],
  ): string[] | null {
    for (const category of cats) {
      const categoryId = category._id || category.id;
      const newPath = [...currentPath, category.name];

      if (categoryId?.toString() === target.toString()) {
        return newPath;
      }

      if (category.subcategories) {
        const found = findPath(category.subcategories, target, newPath);
        if (found) return found;
      }
    }

    return null;
  }

  return findPath(categories, targetId) || [];
}

/**
 * Verifica si una categoría es padre de otra
 */
export function isParentCategory(
  parentId: string,
  childId: string,
  categories: Category[],
): boolean {
  const parent = findCategoryById(categories, parentId);
  if (!parent) return false;

  const allSubIds = getAllSubcategoryIds(parent);
  return allSubIds.includes(childId.toString());
}
