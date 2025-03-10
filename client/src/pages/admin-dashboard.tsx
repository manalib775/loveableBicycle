import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect as ReactuseEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertFaqSchema, type InsertFAQ, type FAQ, type FormField, insertFormFieldSchema, insertBicycleSchema } from "@shared/schema";
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Info, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  insertCitySchema,
  insertSubCitySchema,
  type City,
  type SubCity,
  type InsertCity,
  type InsertSubCity,
} from "@shared/schema";

type FormFieldValues = z.infer<typeof insertFormFieldSchema>;

// Extract system fields from bicycle schema
const systemFields = [
  {
    id: 'brand',
    label: 'Brand',
    type: 'text',
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'model',
    label: 'Model',
    type: 'text',
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    options: ["Adult", "Kids"],
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'condition',
    label: 'Condition',
    type: 'select',
    options: ["Fair", "Good", "Like New"],
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'gearTransmission',
    label: 'Gear Transmission',
    type: 'select',
    options: ["Non-Geared", "Multi-Speed"],
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'frameMaterial',
    label: 'Frame Material',
    type: 'select',
    options: ["Steel", "Aluminum", "Carbon Fiber"],
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'suspension',
    label: 'Suspension',
    type: 'select',
    options: ["None", "Front", "Full"],
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'cycleType',
    label: 'Cycle Type',
    type: 'select',
    options: ["Mountain", "Road", "Hybrid", "BMX", "Other"],
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'wheelSize',
    label: 'Wheel Size',
    type: 'select',
    options: ["12", "16", "20", "24", "26", "27.5", "29"],
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'price',
    label: 'Price',
    type: 'number',
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'hasReceipt',
    label: 'Has Receipt',
    type: 'checkbox',
    required: true,
    visible: true,
    isSystem: true
  },
  {
    id: 'additionalDetails',
    label: 'Additional Details',
    type: 'textarea',
    required: false,
    visible: true,
    isSystem: true
  }
];

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("analytics");
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const { toast } = useToast();

  // Form for editing fields with enhanced validation
  const editForm = useForm<FormFieldValues>({
    resolver: zodResolver(insertFormFieldSchema),
    defaultValues: {
      label: "",
      type: "text",
      required: false,
      visible: true,
      order: 0,
      options: [],
    }
  });

  // Enhanced error handling for mutations
  const createFormFieldMutation = useMutation({
    mutationFn: async (data: FormFieldValues) => {
      try {
        const response = await apiRequest("/api/admin/form-fields", {
          method: "POST",
          body: data,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create form field");
        }
        return response.json() as Promise<FormField>;
      } catch (error) {
        console.error("Form field creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/form-fields"] });
      toast({
        title: "Success",
        description: "Form field created successfully",
      });
      setEditingField(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create form field",
        variant: "destructive",
      });
    },
  });

  const updateFormFieldMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormField> }) => {
      try {
        const response = await apiRequest(`/api/admin/form-fields/${id}`, {
          method: "PATCH",
          body: data,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update form field");
        }
        return response.json() as Promise<FormField>;
      } catch (error) {
        console.error("Form field update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/form-fields"] });
      toast({
        title: "Success",
        description: "Form field updated successfully",
      });
      setEditingField(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update form field",
        variant: "destructive",
      });
    },
  });

  const deleteFormFieldMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/admin/form-fields/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/form-fields"] });
      toast({
        title: "Field Deleted",
        description: "The form field has been deleted successfully.",
      });
    },
  });

  // Effect to update form when editing field changes
  ReactuseEffect(() => {
    if (editingField) {
      editForm.reset({
        label: editingField.label,
        type: editingField.type,
        options: editingField.options || [],
        required: editingField.required || false,
        visible: editingField.visible || true,
        order: editingField.order || 0,
      });
    } else {
      editForm.reset({
        label: "",
        type: "text",
        required: false,
        visible: true,
        order: 0,
        options: [],
      });
    }
  }, [editingField, editForm]);

  const handleFormSubmit = async (data: FormFieldValues) => {
    try {
      if (editingField) {
        // Preserve system status when updating
        await updateFormFieldMutation.mutate({
          id: editingField.id,
          data: {
            ...data,
            isSystem: editingField.isSystem,
          },
        });
      } else {
        await createFormFieldMutation.mutate(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // FAQ form
  const faqForm = useForm<InsertFAQ>({
    resolver: zodResolver(insertFaqSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "general",
      order: 0,
      isActive: true,
    },
  });

  const createFaqMutation = useMutation({
    mutationFn: async (data: InsertFAQ) => {
      const response = await apiRequest("/api/admin/faqs", {
        method: "POST",
        body: data,
      });
      return response.json() as Promise<FAQ>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({
        title: "FAQ Created",
        description: "The FAQ has been created successfully.",
      });
      faqForm.reset();
    },
  });

  const formFieldsQuery = useQuery({
    queryKey: ["/api/admin/form-fields"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/form-fields");
      return response.json() as Promise<FormField[]>;
    }
  });

  // FAQs Query
  const faqsQuery = useQuery({
    queryKey: ["/api/faqs"],
    queryFn: async () => {
      const response = await apiRequest("/api/faqs");
      return response.json() as Promise<FAQ[]>;
    }
  });

  // Analytics Query
  const analyticsQuery = useQuery({
    queryKey: ["/api/admin/analytics/visits"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/analytics/visits");
      return response.json() as Promise<{ [key: string]: string | number }[]>;
    }
  });

  // Combine system fields with custom fields
  const allFields = [
    ...systemFields,
    ...(formFieldsQuery.data || [])
  ];

  // City form
  const cityForm = useForm<InsertCity>({
    resolver: zodResolver(insertCitySchema),
    defaultValues: {
      name: "",
      isActive: true,
    },
  });

  const subCityForm = useForm<InsertSubCity>({
    resolver: zodResolver(insertSubCitySchema),
    defaultValues: {
      name: "",
      cityId: 0,
      isActive: true,
    },
  });

  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingSubCity, setEditingSubCity] = useState<SubCity | null>(null);

  // Add queries
  const citiesQuery = useQuery({
    queryKey: ["/api/admin/cities"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/cities");
      return response.json() as Promise<City[]>;
    }
  });

  const subCitiesQuery = useQuery({
    queryKey: ["/api/admin/sub-cities"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/sub-cities");
      return response.json() as Promise<SubCity[]>;
    }
  });

  // Add mutations
  const createCityMutation = useMutation({
    mutationFn: async (data: InsertCity) => {
      const response = await apiRequest("/api/admin/cities", {
        method: "POST",
        body: data,
      });
      return response.json() as Promise<City>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      toast({
        title: "Success",
        description: "City created successfully",
      });
      setEditingCity(null);
      cityForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create city",
        variant: "destructive",
      });
    },
  });

  const updateCityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<City> }) => {
      const response = await apiRequest(`/api/admin/cities/${id}`, {
        method: "PATCH",
        body: data,
      });
      return response.json() as Promise<City>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      toast({
        title: "Success",
        description: "City updated successfully",
      });
      setEditingCity(null);
      cityForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update city",
        variant: "destructive",
      });
    },
  });

  const createSubCityMutation = useMutation({
    mutationFn: async (data: InsertSubCity) => {
      const response = await apiRequest("/api/admin/sub-cities", {
        method: "POST",
        body: data,
      });
      return response.json() as Promise<SubCity>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-cities"] });
      toast({
        title: "Success",
        description: "Sub-city created successfully",
      });
      setEditingSubCity(null);
      subCityForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sub-city",
        variant: "destructive",
      });
    },
  });

  const updateSubCityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SubCity> }) => {
      const response = await apiRequest(`/api/admin/sub-cities/${id}`, {
        method: "PATCH",
        body: data,
      });
      return response.json() as Promise<SubCity>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-cities"] });
      toast({
        title: "Success",
        description: "Sub-city updated successfully",
      });
      setEditingSubCity(null);
      subCityForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sub-city",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="form-management">Form Management</TabsTrigger>
          <TabsTrigger value="location-management">Location Management</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Visit Analytics</CardTitle>
              <CardDescription>Track user visits and device information</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsQuery.isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : analyticsQuery.error ? (
                <div className="text-center text-destructive p-8">
                  Failed to load analytics data
                </div>
              ) : analyticsQuery.data && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsQuery.data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{String(row.device)}</TableCell>
                        <TableCell>{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Management</CardTitle>
              <CardDescription>Add and manage frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...faqForm}>
                <form
                  onSubmit={faqForm.handleSubmit((data) => createFaqMutation.mutate(data))}
                  className="space-y-4 mb-8"
                >
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input {...faqForm.register("question")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Textarea {...faqForm.register("answer")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...faqForm.register("category")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <Button type="submit" disabled={createFaqMutation.isPending}>
                    Add FAQ
                  </Button>
                </form>

                {faqsQuery.data && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqsQuery.data.map((faq) => (
                        <TableRow key={faq.id}>
                          <TableCell>{faq.question}</TableCell>
                          <TableCell>{faq.category}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form-management">
          <Card>
            <CardHeader>
              <CardTitle>Bicycle Form Management</CardTitle>
              <CardDescription>Customize the bicycle listing form fields and options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Form Fields</h3>
                  <Button
                    onClick={() => {
                      setEditingField(null);
                      editForm.reset({
                        label: "",
                        type: "text",
                        required: false,
                        visible: true,
                        order: 0,
                      });
                    }}
                    disabled={formFieldsQuery.isLoading}
                  >
                    Add Custom Field
                  </Button>
                </div>

                {formFieldsQuery.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : formFieldsQuery.error ? (
                  <div className="text-center text-destructive p-8">
                    Failed to load form fields
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Visible</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allFields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="flex items-center gap-2">
                            {field.label}
                            {field.isSystem && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="gap-1">
                                      <Info className="h-3 w-3" />
                                      System
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>This is a core system field</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell>{field.type}</TableCell>
                          <TableCell>
                            <Switch
                              checked={field.required ?? false}
                              onCheckedChange={(checked) => {
                                updateFormFieldMutation.mutate({
                                  id: field.id as number,
                                  data: { required: checked },
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={field.visible ?? true}
                              onCheckedChange={(checked) => {
                                updateFormFieldMutation.mutate({
                                  id: field.id as number,
                                  data: { visible: checked },
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingField(field as FormField)}
                              >
                                Edit
                              </Button>
                              {!field.isSystem && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this field?')) {
                                      deleteFormFieldMutation.mutate(field.id as number);
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {(editingField !== null || !formFieldsQuery.data?.length) && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>
                        {editingField ? (
                          <div className="flex items-center gap-2">
                            Edit Field
                            {editingField.isSystem && (
                              <Badge variant="secondary" className="gap-1">
                                <Info className="h-3 w-3" />
                                System
                              </Badge>
                            )}
                          </div>
                        ) : (
                          'Add Field'
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleFormSubmit)} className="space-y-4">
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                              <Input {...editForm.register("label")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>

                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              value={editForm.watch("type")}
                              onValueChange={(value: "text" | "number" | "select" | "checkbox" | "textarea") => {
                                editForm.setValue("type", value);
                                // Clear options if changing from select to another type
                                if (value !== "select") {
                                  editForm.setValue("options", []);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="select">Dropdown</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="textarea">Text Area</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>

                          {editForm.watch("type") === "select" && (
                            <FormItem>
                              <FormLabel>Options (one per line)</FormLabel>
                              <FormControl>
                                <Textarea
                                  value={editForm.watch("options")?.join("\n") ?? ""}
                                  onChange={(e) =>
                                    editForm.setValue(
                                      "options",
                                      e.target.value.split("\n").filter(Boolean)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}

                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>Required</FormLabel>
                              <Switch
                                checked={editForm.watch("required") ?? false}
                                onCheckedChange={(checked) => editForm.setValue("required", checked)}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>

                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>Visible</FormLabel>
                              <Switch
                                checked={editForm.watch("visible") ?? true}
                                onCheckedChange={(checked) => editForm.setValue("visible", checked)}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>

                          <div className="flex gap-4">
                            <Button
                              type="submit"
                              disabled={
                                !editForm.formState.isDirty ||
                                createFormFieldMutation.isPending ||
                                updateFormFieldMutation.isPending
                              }
                            >
                              {createFormFieldMutation.isPending || updateFormFieldMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                'Save Field'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingField(null);
                                editForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location-management">
          <Card>
            <CardHeader>
              <CardTitle>Location Management</CardTitle>
              <CardDescription>Manage cities and sub-cities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Cities Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Cities</h3>
                    <Button
                      onClick={() => {
                        setEditingCity(null);
                        cityForm.reset();
                      }}
                    >
                      Add City
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* City Form */}
                    {(editingCity !== null || !citiesQuery.data?.length) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>{editingCity ? 'Edit City' : 'Add City'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Form {...cityForm}>
                            <form onSubmit={cityForm.handleSubmit((data) => {
                              if (editingCity) {
                                updateCityMutation.mutate({ id: editingCity.id, data });
                              } else {
                                createCityMutation.mutate(data);
                              }
                            })} className="space-y-4">
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...cityForm.register("name")} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>

                              <FormItem>
                                <div className="flex items-center gap-2">
                                  <FormLabel>Active</FormLabel>
                                  <Switch
                                    checked={cityForm.watch("isActive")}
                                    onCheckedChange={(checked) => cityForm.setValue("isActive", checked)}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>

                              <div className="flex gap-2">
                                <Button
                                  type="submit"
                                  disabled={!cityForm.formState.isDirty || createCityMutation.isPending || updateCityMutation.isPending}
                                >
                                  {createCityMutation.isPending || updateCityMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    'Save City'
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCity(null);
                                    cityForm.reset();
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    )}

                    {/* Cities Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {citiesQuery.data?.map((city) => (
                          <TableRow key={city.id}>
                            <TableCell>{city.name}</TableCell>
                            <TableCell>
                              <Switch
                                checked={city.isActive}
                                onCheckedChange={(checked) => {
                                  updateCityMutation.mutate({
                                    id: city.id,
                                    data: { isActive: checked },
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCity(city);
                                  cityForm.reset({
                                    name: city.name,
                                    isActive: city.isActive,
                                  });
                                }}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Sub-cities Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Sub-cities</h3>
                    <Button
                      onClick={() => {
                        setEditingSubCity(null);
                        subCityForm.reset();
                      }}
                      disabled={!citiesQuery.data?.length}
                    >
                      Add Sub-city
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Sub-city Form */}
                    {(editingSubCity !== null || !subCitiesQuery.data?.length) && citiesQuery.data?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>{editingSubCity ? 'Edit Sub-city' : 'Add Sub-city'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Form {...subCityForm}>
                            <form onSubmit={subCityForm.handleSubmit((data) => {
                              if (editingSubCity) {
                                updateSubCityMutation.mutate({ id: editingSubCity.id, data });
                              } else {
                                createSubCityMutation.mutate(data);
                              }
                            })} className="space-y-4">
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <Select
                                  value={String(subCityForm.watch("cityId"))}
                                  onValueChange={(value) => subCityForm.setValue("cityId", parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a city" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {citiesQuery.data?.map((city) => (
                                      <SelectItem key={city.id} value={String(city.id)}>
                                        {city.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>

                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...subCityForm.register("name")} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>

                              <FormItem>
                                <div className="flex items-center gap-2">
                                  <FormLabel>Active</FormLabel>
                                  <Switch
                                    checked={subCityForm.watch("isActive")}
                                    onCheckedChange={(checked) => subCityForm.setValue("isActive", checked)}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>

                              <div className="flex gap-2">
                                <Button
                                  type="submit"
                                  disabled={!subCityForm.formState.isDirty || createSubCityMutation.isPending || updateSubCityMutation.isPending}
                                >
                                  {createSubCityMutation.isPending || updateSubCityMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    'Save Sub-city'
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingSubCity(null);
                                    subCityForm.reset();
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    )}

                    {/* Sub-cities Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>City</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subCitiesQuery.data?.map((subCity) => {
                          const city = citiesQuery.data?.find(c => c.id === subCity.cityId);
                          return (
                            <TableRow key={subCity.id}>
                              <TableCell>{city?.name}</TableCell>
                              <TableCell>{subCity.name}</TableCell>
                              <TableCell>
                                <Switch
                                  checked={subCity.isActive}
                                  onCheckedChange={(checked) => {
                                    updateSubCityMutation.mutate({
                                      id: subCity.id,
                                      data: { isActive: checked },
                                    });
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSubCity(subCity);
                                    subCityForm.reset({
                                      name: subCity.name,
                                      cityId: subCity.cityId,
                                      isActive: subCity.isActive,
                                    });
                                  }}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}