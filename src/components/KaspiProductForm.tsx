import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Image as ImageIcon, Package, Save, Loader2 } from "lucide-react";
import { Product, ProductSchema, Category, Attribute, KaspiApiClient } from "@/lib/kaspi-api";
import { useToast } from "@/hooks/use-toast";

interface KaspiProductFormProps {
  kaspiClient: KaspiApiClient | null;
  onProductAdded: () => void;
}

export const KaspiProductForm = ({ kaspiClient, onProductAdded }: KaspiProductFormProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<Product>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      sku: "",
      title: "",
      brand: "",
      category: "",
      description: "",
      images: [{ url: "" }],
      attributes: []
    }
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "images"
  });

  const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({
    control: form.control,
    name: "attributes"
  });

  // Загрузка категорий
  useEffect(() => {
    const loadCategories = async () => {
      if (!kaspiClient) return;
      
      setCategoriesLoading(true);
      try {
        const categoriesData = await kaspiClient.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        toast({
          title: "Ошибка загрузки категорий",
          description: error instanceof Error ? error.message : "Не удалось загрузить категории",
          variant: "destructive",
        });
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [kaspiClient, toast]);

  // Загрузка атрибутов при изменении категории
  const handleCategoryChange = async (categoryCode: string) => {
    if (!kaspiClient) return;
    
    setAttributesLoading(true);
    try {
      const attributesData = await kaspiClient.getCategoryAttributes(categoryCode);
      setAttributes(attributesData);
      
      // Очистка существующих атрибутов и добавление новых
      form.setValue("attributes", []);
      attributesData.forEach(attr => {
        appendAttribute({ code: attr.code, value: "" });
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки атрибутов",
        description: error instanceof Error ? error.message : "Не удалось загрузить атрибуты категории",  
        variant: "destructive",
      });
    } finally {
      setAttributesLoading(false);
    }
  };

  const onSubmit = async (data: Product) => {
    if (!kaspiClient) {
      toast({
        title: "Ошибка",
        description: "API клиент не настроен",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Фильтруем пустые изображения и атрибуты
      const filteredData = {
        ...data,
        images: data.images.filter(img => img.url.trim() !== ""),
        attributes: data.attributes.filter(attr => attr.value.trim() !== "")
      };

      const result = await kaspiClient.addProduct(filteredData);
      
      toast({
        title: "Товар добавлен",
        description: `Товар успешно добавлен. Код загрузки: ${result.code}`,
      });

      // Сброс формы
      form.reset();
      setAttributes([]);
      onProductAdded();
      
    } catch (error) {
      toast({
        title: "Ошибка добавления товара",
        description: error instanceof Error ? error.message : "Не удалось добавить товар",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttributeByCode = (code: string) => {
    return attributes.find(attr => attr.code === code);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Добавить товар на Kaspi.kz
        </CardTitle>
        <CardDescription>
          Заполните информацию о товаре для публикации на маркетплейсе
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Основная информация */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Основная информация</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl>
                        <Input placeholder="Артикул товара" {...field} />
                      </FormControl>
                      <FormDescription>
                        Уникальный артикул товара
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Бренд *</FormLabel>
                      <FormControl>
                        <Input placeholder="Название бренда" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название товара *</FormLabel>
                    <FormControl>
                      <Input placeholder="Полное название товара" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Подробное описание товара"
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Категория */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Категория</h3>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория товара *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCategoryChange(value);
                      }}
                      value={field.value}
                      disabled={categoriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={categoriesLoading ? "Загружаем категории..." : "Выберите категорию"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.code} value={category.code}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Изображения */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Изображения</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendImage({ url: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить изображение
                </Button>
              </div>

              {imageFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`images.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>URL изображения {index + 1}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {imageFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImage(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Атрибуты */}
            {attributes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Характеристики товара
                  {attributesLoading && (
                    <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attributeFields.map((field, index) => {
                    const attributeInfo = getAttributeByCode(field.code);
                    
                    return (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`attributes.${index}.value`}
                        render={({ field: valueField }) => (
                          <FormItem>
                            <FormLabel>
                              {attributeInfo?.name || field.code}
                              {attributeInfo?.required && <span className="text-destructive ml-1">*</span>}
                            </FormLabel>
                            
                            {attributeInfo?.values && attributeInfo.values.length > 0 ? (
                              <Select onValueChange={valueField.onChange} value={valueField.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите значение" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {attributeInfo.values.map((value) => (
                                    <SelectItem key={value} value={value}>
                                      {value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <FormControl>
                                <Input 
                                  placeholder="Введите значение"
                                  {...valueField}
                                />
                              </FormControl>
                            )}
                            
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Кнопка отправки */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} size="lg">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Добавляем товар...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Добавить товар
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};