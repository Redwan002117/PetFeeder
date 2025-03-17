import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { HandPlatter, Loader2 } from "lucide-react";
import { DeviceData } from "@/hooks/use-device-data";

interface DeviceFeedControlProps {
  deviceId: string;
  disabled?: boolean;
  onFeedSuccess?: () => void;
  initialAmount?: number;
  minAmount?: number;
  maxAmount?: number;
}

const DeviceFeedControl: React.FC<DeviceFeedControlProps> = ({
  deviceId,
  disabled = false,
  onFeedSuccess,
  initialAmount = 20,
  minAmount = 5,
  maxAmount = 100
}) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(initialAmount);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const handleFeed = async () => {
    if (!currentUser || !deviceId) return;

    setLoading(true);
    try {
      // Create a feed command in Supabase
      const { error } = await supabase
        .from('feed_commands')
        .insert({
          device_id: deviceId,
          user_id: currentUser.id,
          amount,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Feeding initiated",
        description: `Dispensing ${amount}g of food...`,
      });

      // Simulate a delay for the feeding process
      setTimeout(() => {
        if (onFeedSuccess) {
          onFeedSuccess();
        }

        toast({
          title: "Feeding complete",
          description: `Successfully dispensed ${amount}g of food.`,
          variant: "success",
        });

        // Insert a record in the feeding history table
        supabase
          .from('feeding_history')
          .insert({
            device_id: deviceId,
            amount,
            type: 'manual',
            timestamp: new Date().toISOString()
          })
          .then(({ error }) => {
            if (error) {
              console.error("Error recording feed history:", error);
            }
          });
      }, 2000);

    } catch (error: any) {
      console.error("Error initiating feed:", error);
      toast({
        title: "Feed failed",
        description: error.message || "An error occurred while trying to feed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Feed</CardTitle>
        <CardDescription>
          Dispense food manually with your desired amount
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Amount</span>
            <span className="text-sm font-medium">{amount}g</span>
          </div>
          <Slider
            value={[amount]}
            min={minAmount}
            max={maxAmount}
            step={1}
            onValueChange={(value) => setAmount(value[0])}
            disabled={loading || disabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{minAmount}g</span>
            <span>{maxAmount}g</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleFeed}
          disabled={loading || disabled}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Feeding...
            </>
          ) : (
            <>
              <HandPlatter className="mr-2 h-4 w-4" />
              Feed Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeviceFeedControl;
