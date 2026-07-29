import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { Plus, Trash2 } from 'lucide-react';
import { createMorningSummary } from '../api/morningSummaryApi';
import { morningSummarySchema, MorningSummaryFormData } from '../schemas/morningSummarySchema';
import { getReps } from '@/features/reps/api/repApi';
import { getDrivers } from '@/features/drivers/api/driverApi';
import { getProducts } from '@/features/products/api/productApi';

interface MorningSummaryFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MorningSummaryFormDrawer: React.FC<MorningSummaryFormDrawerProps> = ({ open, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: repsData } = useQuery({ queryKey: ['reps'], queryFn: () => getReps(0, 100) });
  const { data: driversData } = useQuery({ queryKey: ['drivers'], queryFn: () => getDrivers(0, 100) });
  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => getProducts(0, 100) });

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<MorningSummaryFormData>({
    resolver: zodResolver(morningSummarySchema),
    defaultValues: {
      items: [{ productId: 0, quantity: 0, expectedReturnAmount: 0, expectedReturnPrice: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");

  const calculateEstimate = (index: number) => {
    const item = watchItems[index];
    if (!item || !item.productId || !item.quantity) return 0;
    const product = productsData?.content.find(p => p.id === item.productId);
    if (!product) return 0;
    return (product.ratePerSoldUnit || 0) * item.quantity;
  };

  const calculateTotalEstimate = () => {
    return watchItems.reduce((total, _, index) => total + calculateEstimate(index), 0);
  };

  const mutation = useMutation({
    mutationFn: createMorningSummary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningSummaries'] });
      toast({ title: 'Success', description: 'Morning Summary created successfully.' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create Morning Summary.', variant: 'destructive' });
    }
  });

  const onSubmit = (data: MorningSummaryFormData) => {
    mutation.mutate({
      repId: data.repId,
      driverId: data.driverId,
      items: data.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        expectedReturnAmount: item.expectedReturnAmount,
        expectedReturnPrice: item.expectedReturnPrice
      }))
    });
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Create Morning Summary</DrawerTitle>
        </DrawerHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Rep</Label>
              <Select onValueChange={(v) => setValue('repId', Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Rep" />
                </SelectTrigger>
                <SelectContent>
                  {repsData?.content.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id.toString()}>{rep.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.repId && <span className="text-sm text-red-500">{errors.repId.message}</span>}
            </div>

            <div className="space-y-2">
              <Label>Driver</Label>
              <Select onValueChange={(v) => setValue('driverId', Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  {driversData?.content.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>{driver.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.driverId && <span className="text-sm text-red-500">{errors.driverId.message}</span>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: 0, quantity: 0, expectedReturnAmount: 0, expectedReturnPrice: 0 })}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>
            
            {errors.items?.message && <span className="text-sm text-red-500">{errors.items.message}</span>}

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end border p-3 rounded-md bg-gray-50/50">
                <div className="col-span-1 flex items-center justify-center pb-2">
                  <span className="font-medium text-gray-500">{index + 1}.</span>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Product</Label>
                  <Select onValueChange={(v) => setValue(`items.${index}.productId`, Number(v))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsData?.content.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input type="number" className="h-9" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Exp Return Qty</Label>
                  <Input type="number" className="h-9" {...register(`items.${index}.expectedReturnAmount`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Exp Return Value</Label>
                  <Input type="number" step="0.01" className="h-9" {...register(`items.${index}.expectedReturnPrice`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Estimate</Label>
                  <div className="h-9 flex items-center font-semibold text-green-700">
                    Rs. {calculateEstimate(index).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-9 w-9 text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-end">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 min-w-64">
              <div className="text-sm text-blue-600 font-medium">Final Estimate Value</div>
              <div className="text-2xl font-bold text-blue-900">Rs. {calculateTotalEstimate().toFixed(2)}</div>
            </div>
          </div>

          <DrawerFooter className="px-0">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Morning Summary'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};
