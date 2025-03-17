import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save } from 'lucide-react';

// Update the FeedingSchedule interface to include device_id
interface FeedingSchedule {
  id: string;
  time: string;
  days: boolean[];
  amount: number;
  enabled: boolean;
  device_id: string;  // Add this property
  created_at?: string;
  updated_at?: string;
}

// Update the interface to include device_id
interface FeedingScheduleInput {
  time: string;
  days: boolean[];
  amount: number;
  enabled: boolean;
  device_id: string;
}

interface ScheduleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (schedule: Omit<FeedingSchedule, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialData?: Partial<Omit<FeedingSchedule, 'created_at' | 'updated_at'>>;
  deviceId: string;
  minFeedAmount?: number;
  maxFeedAmount?: number;
}

const daysOfWeek = [
  { id: 'sunday', label: 'Sun' },
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
];

const formSchema = z.object({
  time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in 24-hour format (HH:MM)'),
  days: z.array(z.boolean()).length(7),
  amount: z.number().min(1).max(100),
  enabled: z.boolean().default(true),
});

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  deviceId,
  minFeedAmount = 5,
  maxFeedAmount = 100,
}) => {
  const [loading, setLoading] = useState(false);
  
  const defaultValues = {
    time: initialData?.time || '08:00',
    days: initialData?.days || [true, true, true, true, true, true, true],
    amount: initialData?.amount || 20,
    enabled: initialData?.enabled ?? true,
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      await onSubmit({
        ...values,
        device_id: deviceId,
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting schedule:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Make sure all days have a value (true or false)
  const days = form.watch('days');
  const normalizedDays = Array.from({ length: 7 }).map((_, i) => days?.[i] ?? false);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData && initialData.id ? 'Edit Feeding Schedule' : 'Add Feeding Schedule'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feeding Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormDescription>
                    Set the time for feeding (24-hour format)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="days"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Days</FormLabel>
                    <FormDescription>
                      Select days when feeding should occur
                    </FormDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day, index) => (
                      <FormField
                        key={day.id}
                        control={form.control}
                        name={`days.${index}`}
                        render={({ field }) => {
                          return (
                            <FormItem key={day.id} className="flex flex-col items-center space-y-1">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={loading}
                                  id={day.id}
                                />
                              </FormControl>
                              <FormLabel htmlFor={day.id} className="text-xs">{day.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (grams)</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        min={minFeedAmount}
                        max={maxFeedAmount}
                        step={1}
                        onValueChange={(values) => field.onChange(values[0])}
                        disabled={loading}
                        className="flex-grow"
                      />
                    </FormControl>
                    <span className="w-12 text-right font-medium">{field.value}g</span>
                  </div>
                  <FormDescription>
                    Amount of food to dispense
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enabled
                    </FormLabel>
                    <FormDescription>
                      This schedule will be active when enabled
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {initialData && initialData.id ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleForm;
