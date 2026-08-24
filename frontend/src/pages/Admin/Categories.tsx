import { useState } from 'react'
import { Archive, Pencil, Plus, Search, Tag } from 'lucide-react'
import { apiErrorMessage } from '@/api/client'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { useCategories, useCreateCategory, useSetCategoryActive, useUpdateCategory } from '@/hooks/useCatalog'
import type { Category } from '@/types/catalog'

interface CategoryForm {
  name: string
  description: string
}

export default function Categories() {
  const [search, setSearch] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [editing, setEditing] = useState<Category | null | undefined>(undefined)
  const [form, setForm] = useState<CategoryForm>({ name: '', description: '' })
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const categoriesQuery = useCategories({ search: search.trim() || undefined, include_archived: includeArchived })
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const activeMutation = useSetCategoryActive()

  const openModal = (category: Category | null) => {
    setEditing(category)
    setForm(category
      ? { name: category.name, description: category.description ?? '' }
      : { name: '', description: '' })
    setError('')
  }

  const saveCategory = async () => {
    if (!form.name.trim()) {
      setError('Category name is required.')
      return
    }

    setError('')
    try {
      const input = { name: form.name.trim(), description: form.description.trim() || null }
      if (editing) await updateMutation.mutateAsync({ id: editing.id, input })
      else await createMutation.mutateAsync(input)
      setEditing(undefined)
      setToast(`Category ${editing ? 'updated' : 'added'} successfully.`)
    } catch (mutationError) {
      setError(apiErrorMessage(mutationError))
    }
  }

  const setActive = async (category: Category, isActive: boolean) => {
    if (!window.confirm(`${isActive ? 'Restore' : 'Archive'} “${category.name}”?`)) return
    setError('')
    try {
      await activeMutation.mutateAsync({ id: category.id, isActive })
      setToast(`“${category.name}” ${isActive ? 'restored' : 'archived'} successfully.`)
    } catch (mutationError) {
      setError(apiErrorMessage(mutationError))
    }
  }

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {editing !== undefined && (
        <Modal
          title={editing ? 'Edit Category' : 'Add Category'}
          onClose={() => setEditing(undefined)}
          footer={
            <>
              <button onClick={() => setEditing(undefined)} className="px-4 py-2 border border-[#D9D9D9] rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button disabled={createMutation.isPending || updateMutation.isPending} onClick={() => void saveCategory()} className="px-4 py-2 bg-[#C72C41] hover:bg-[#A50034] text-white rounded-lg text-sm font-medium disabled:opacity-60">Save Category</button>
            </>
          }
        >
          {error && <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="field-label">Category Name *</label>
              <input autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="form-input" placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="field-label">Description</label>
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="form-input resize-none" placeholder="Brief description..." />
            </div>
          </div>
        </Modal>
      )}

      {error && editing === undefined && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm">
        <div className="flex flex-wrap items-center gap-3 justify-between px-5 py-4 border-b border-[#D9D9D9]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F5F5F5] border border-[#D9D9D9] rounded-lg px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="bg-transparent text-sm outline-none placeholder:text-gray-400 w-52" placeholder="Search categories..." />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} className="accent-[#C72C41]" />
              Include archived
            </label>
          </div>
          <button onClick={() => openModal(null)} className="flex items-center gap-2 bg-[#C72C41] hover:bg-[#A50034] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={15} /> Add Category
          </button>
        </div>
        <div className="overflow-x-auto min-h-56">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#F5F5F5] text-xs text-gray-500">
              <th className="text-left px-5 py-3 font-medium">Category</th>
              <th className="text-left px-5 py-3 font-medium">Description</th>
              <th className="text-left px-5 py-3 font-medium">Books</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {(categoriesQuery.data ?? []).map((category) => (
                <tr key={category.id} className={`border-t border-[#F5F5F5] hover:bg-gray-50/50 ${!category.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3 font-medium text-[#1A1A2E]">{category.name}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs max-w-xs">{category.description ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{category.books_count}</td>
                  <td className="px-5 py-3"><Badge variant={category.is_active ? 'active' : 'inactive'} label={category.is_active ? 'Active' : 'Archived'} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button disabled={!category.is_active} onClick={() => openModal(category)} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors disabled:opacity-30" title="Edit"><Pencil size={14} /></button>
                      <button disabled={activeMutation.isPending} onClick={() => void setActive(category, !category.is_active)} className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${category.is_active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'}`} title={category.is_active ? 'Archive' : 'Restore'}><Archive size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categoriesQuery.isLoading && <div className="py-12 text-center text-sm text-gray-400">Loading categories...</div>}
          {categoriesQuery.isError && <div className="py-12 text-center text-sm text-red-600">{apiErrorMessage(categoriesQuery.error)}</div>}
          {!categoriesQuery.isLoading && !categoriesQuery.isError && (categoriesQuery.data?.length ?? 0) === 0 && <div className="py-12 text-center text-sm text-gray-400"><Tag size={28} className="mx-auto mb-2 text-gray-300" />No categories found.</div>}
        </div>
      </div>
    </div>
  )
}

