'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export default function ProdutosPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catName, setCatName] = useState('');

  // Product dialog
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    seasonal: false,
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        api.get('/products/categories'),
        api.get('/products'),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const createCategory = async () => {
    if (!catName.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/products/categories', { name: catName });
      setCatName('');
      setCatDialogOpen(false);
      fetchAll();
      toast.success('Categoria criada');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/products/categories/${id}`);
      fetchAll();
      toast.success('Categoria removida');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    }
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      description: '',
      price: '',
      categoryId: categories[0]?.id ?? '',
      seasonal: false,
      active: true,
    });
    setProdDialogOpen(true);
  };

  const openEditProduct = (product: any) => {
    setEditingProduct(product);
    setProdForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      categoryId: product.categoryId,
      seasonal: product.seasonal,
      active: product.active,
    });
    setProdDialogOpen(true);
  };

  const saveProduct = async () => {
    if (!prodForm.name.trim() || !prodForm.price || !prodForm.categoryId) {
      toast.error('Preencha nome, preço e categoria');
      return;
    }
    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, {
          ...prodForm,
          price: parseFloat(prodForm.price),
        });
        toast.success('Produto atualizado');
      } else {
        await api.post('/products', {
          ...prodForm,
          price: parseFloat(prodForm.price),
        });
        toast.success('Produto criado');
      }
      setProdDialogOpen(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (product: any) => {
    try {
      await api.patch(`/products/${product.id}`, { active: !product.active });
      fetchAll();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const productsByCategory = categories.map((cat) => ({
    ...cat,
    products: products.filter((p) => p.categoryId === cat.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatDialogOpen(true)}>
            <Plus className="size-4" />
            Categoria
          </Button>
          <Button onClick={openCreateProduct} disabled={categories.length === 0}>
            <Plus className="size-4" />
            Produto
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {productsByCategory.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{cat.name}</CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="sm" className="text-destructive text-xs" />
                    }
                  >
                    <Trash2 className="size-3.5" />
                    Remover
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover categoria "{cat.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso só funciona se não houver produtos vinculados a esta categoria.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCategory(cat.id)}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="space-y-2">
                {cat.products.length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhum produto nesta categoria.</p>
                )}
                {cat.products.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={p.active ? '' : 'line-through text-muted-foreground'}>
                        {p.name}
                      </span>
                      {p.seasonal && (
                        <Badge variant="outline" className="text-xs">
                          Sazonal
                        </Badge>
                      )}
                      <span className="text-muted-foreground">
                        {Number(p.price).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={p.active}
                        onCheckedChange={() => toggleActive(p)}
                        aria-label={p.active ? 'Desativar' : 'Ativar'}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditProduct(p)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {categories.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Crie uma categoria para começar.
            </p>
          )}
        </>
      )}

      {/* Category dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nome</Label>
            <Input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ex: Bolos, Doces, Tortas..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={submitting} onClick={createCategory}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product dialog */}
      <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                value={prodForm.name}
                onChange={(e) => setProdForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea
                value={prodForm.description}
                onChange={(e) =>
                  setProdForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                placeholder="Descrição opcional do produto"
              />
            </div>
            <div className="space-y-1">
              <Label>Preço (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={prodForm.price}
                onChange={(e) => setProdForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Categoria *</Label>
              <Select
                value={prodForm.categoryId}
                onValueChange={(v) => setProdForm((f) => ({ ...f, categoryId: v ?? f.categoryId }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={prodForm.seasonal}
                  onCheckedChange={(checked) =>
                    setProdForm((f) => ({ ...f, seasonal: !!checked }))
                  }
                />
                <Label>Sazonal</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={prodForm.active}
                  onCheckedChange={(checked) =>
                    setProdForm((f) => ({ ...f, active: !!checked }))
                  }
                />
                <Label>Ativo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdDialogOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={submitting} onClick={saveProduct}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
