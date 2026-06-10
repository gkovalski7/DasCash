import React from 'react'

const CategoryNotice: React.FC<{ categories: string[] }> = ({ categories }) => {
  return (
    <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      Categorías excluidas: {categories.join(', ')}
    </div>
  )
}

export default CategoryNotice
