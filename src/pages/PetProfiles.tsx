import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database, ref, onValue, off, push, update, remove, serverTimestamp } from '@/lib/firebase';
import { safeRef, safeOnValue, safeUpdate, safePush, safeRemove } from '@/lib/firebase-utils';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Icons and Utilities
import { PlusCircle, Edit, Trash2, Cat, Dog, Rabbit, Bird, Fish, Camera, Loader2, PawPrint, Heart, Weight, Activity, Plus, Calendar, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from '@/components/PageHeader';
import { Spinner } from '@/components/Spinner';

// Add motion imports for animations
import { motion } from "framer-motion";

// Add additional imports for health tracking
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: number;
  feedingSchedule?: string;
  foodType?: string;
  foodAmount?: number;
  notes?: string;
  photoURL?: string;
  createdAt: number;
  healthRecords?: Record<string, HealthRecord>;
}

interface HealthRecord {
  id: string;
  date: string;
  weight: number;
  activityLevel: 'low' | 'normal' | 'high';
  foodIntake: 'low' | 'normal' | 'high';
  notes?: string;
  timestamp: number;
}

// Add animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

// Add health stats calculation function
const calculateHealthStats = (records: HealthRecord[]) => {
  if (!records || records.length === 0) return null;
  
  // Get weight data for chart
  const weightData = records
    .slice(0, 10) // Get last 10 records
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date ascending
    .map(record => ({
      date: format(parseISO(record.date), 'MMM dd'),
      weight: record.weight
    }));
  
  // Calculate average weight
  const totalWeight = records.reduce((sum, record) => sum + record.weight, 0);
  const avgWeight = records.length > 0 ? (totalWeight / records.length).toFixed(1) : 0;
  
  // Calculate weight change
  const oldestRecord = records[records.length - 1];
  const newestRecord = records[0];
  const weightChange = newestRecord && oldestRecord 
    ? (newestRecord.weight - oldestRecord.weight).toFixed(1)
    : 0;
  
  // Calculate activity level distribution
  const activityLevels = {
    low: records.filter(r => r.activityLevel === 'low').length,
    normal: records.filter(r => r.activityLevel === 'normal').length,
    high: records.filter(r => r.activityLevel === 'high').length
  };
  
  return {
    weightData,
    avgWeight,
    weightChange,
    activityLevels,
    recordCount: records.length
  };
};

const PetProfiles = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'cat',
    breed: '',
    age: '',
    weight: '',
    feedingSchedule: '',
    foodType: '',
    foodAmount: '',
    notes: '',
    photoURL: ''
  });

  // Add health record states
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loadingHealthRecords, setLoadingHealthRecords] = useState(false);
  const [showAddHealthRecord, setShowAddHealthRecord] = useState(false);
  const [newHealthRecord, setNewHealthRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    notes: '',
    activityLevel: 'normal',
    foodIntake: 'normal'
  });

  // Load pets data
  useEffect(() => {
    if (!currentUser) return;

    const petsRef = safeRef(`users/${currentUser.uid}/pets`);
    if (!petsRef) {
      setPets([]);
      setLoading(false);
      return;
    }

    const unsubscribe = safeOnValue(
      `users/${currentUser.uid}/pets`,
      (snapshot) => {
        if (snapshot.exists()) {
          const petsData = snapshot.val();

          // Convert to array
          const petsArray = Object.keys(petsData).map(key => ({
            id: key,
            ...petsData[key]
          }));

          // Sort pets by name
          petsArray.sort((a, b) => a.name.localeCompare(b.name));

          setPets(petsArray);
        } else {
          setPets([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching pets:", error);
        setPets([]);
        setLoading(false);
      }
    );

    // Clean up listener on component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cat',
      breed: '',
      age: '',
      weight: '',
      feedingSchedule: '',
      foodType: '',
      foodAmount: '',
      notes: '',
      photoURL: ''
    });
  };

  const handleAddPet = async () => {
    if (!currentUser) return;
    if (!formData.name) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your pet.",
        variant: "destructive",
      });
      return;
    }

    try {
      // If no photo was uploaded, generate a default avatar
      if (!formData.photoURL) {
        formData.photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff&size=200`;
      }
      
      // Prepare the pet data with proper type conversions
      const petData = {
        name: formData.name,
        type: formData.type,
        breed: formData.breed || '',
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        feedingSchedule: formData.feedingSchedule || '',
        foodType: formData.foodType || '',
        foodAmount: formData.foodAmount ? parseFloat(formData.foodAmount) : null,
        notes: formData.notes || '',
        photoURL: formData.photoURL,
        createdAt: Date.now()
      };
      
      console.log("Adding pet with data:", petData);
      
      // Use safePush to generate a unique ID and path
      const petId = await safePush(`users/${currentUser.uid}/pets`, petData);
      
      if (!petId) {
        throw new Error("Failed to generate pet ID");
      }
      
      console.log("Pet added successfully with ID:", petId);

      toast({
        title: "Pet Added",
        description: `${formData.name} has been added to your pets.`,
      });

      resetForm();
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding pet:', error);
      toast({
        title: "Error",
        description: "Failed to add pet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet);
    setFormData({
      name: pet.name,
      type: pet.type,
      breed: pet.breed || '',
      age: pet.age ? pet.age.toString() : '',
      weight: pet.weight ? pet.weight.toString() : '',
      feedingSchedule: pet.feedingSchedule || '',
      foodType: pet.foodType || '',
      foodAmount: pet.foodAmount ? pet.foodAmount.toString() : '',
      notes: pet.notes || '',
      photoURL: pet.photoURL || ''
    });
    
    // Load health records for this pet
    fetchPetHealthRecords(pet.id);
    
    setEditDialogOpen(true);
  };

  const handleUpdatePet = async () => {
    if (!currentUser || !selectedPet) return;
    if (!formData.name) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your pet.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the pet using safeUpdate
      await safeUpdate(`users/${currentUser.uid}/pets/${selectedPet.id}`, {
        name: formData.name,
        type: formData.type,
        breed: formData.breed || '',
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        feedingSchedule: formData.feedingSchedule || '',
        foodType: formData.foodType || '',
        foodAmount: formData.foodAmount ? parseFloat(formData.foodAmount) : null,
        notes: formData.notes || '',
        photoURL: formData.photoURL || '',
        updatedAt: Date.now()
      });

      toast({
        title: "Pet Updated",
        description: `${formData.name} has been updated successfully.`,
      });

      setEditDialogOpen(false);
      setSelectedPet(null);
    } catch (error) {
      console.error('Error updating pet:', error);
      toast({
        title: "Error",
        description: "Failed to update pet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (pet: Pet) => {
    setSelectedPet(pet);
    setDeleteDialogOpen(true);
  };

  const handleDeletePet = async () => {
    if (!currentUser || !selectedPet) return;

    try {
      // Delete the pet using safeRemove
      await safeRemove(`users/${currentUser.uid}/pets/${selectedPet.id}`);

      toast({
        title: "Pet Deleted",
        description: `${selectedPet.name} has been removed from your pets.`,
      });

      setDeleteDialogOpen(false);
      setSelectedPet(null);
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast({
        title: "Error",
        description: "Failed to delete pet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingPhoto(true);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'petfeeder'); // Use a public upload preset that doesn't require authentication
      
      // Upload to Cloudinary using a public cloud name
      const response = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.secure_url) {
        // Update the form data with the new photo URL
        setFormData(prev => ({
          ...prev,
          photoURL: data.secure_url
        }));
        
        // If we're editing a pet, update the pet's photo URL in the database
        if (selectedPet && editDialogOpen) {
          await safeUpdate(`users/${currentUser.uid}/pets/${selectedPet.id}`, {
            photoURL: data.secure_url
          });
          
          toast({
            title: "Photo Updated",
            description: "Pet photo has been updated successfully.",
          });
        }
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload pet photo. Using default image instead.",
        variant: "destructive",
      });
      
      // Set a default image URL if upload fails
      setFormData(prev => ({
        ...prev,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff&size=200`
      }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getPetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cat':
        return <Cat className="h-5 w-5" />;
      case 'dog':
        return <Dog className="h-5 w-5" />;
      case 'rabbit':
        return <Rabbit className="h-5 w-5" />;
      case 'bird':
        return <Bird className="h-5 w-5" />;
      case 'fish':
        return <Fish className="h-5 w-5" />;
      default:
        return <PawPrint className="h-5 w-5" />;
    }
  };

  // Add function to fetch health records for a specific pet
  const fetchPetHealthRecords = async (petId: string) => {
    if (!currentUser) return;
    
    setLoadingHealthRecords(true);
    try {
      const healthSnapshot = await safeOnValue(`users/${currentUser.uid}/pets/${petId}/healthRecords`, (snapshot) => {
        if (snapshot && snapshot.exists()) {
          const healthData = snapshot.val();
          // Convert object to array and sort by date (newest first)
          const records = Object.keys(healthData).map(key => ({
            id: key,
            ...healthData[key]
          })).sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          });
          
          setHealthRecords(records);
        } else {
          setHealthRecords([]);
        }
        setLoadingHealthRecords(false);
      });
      
      return () => {
        if (healthSnapshot) healthSnapshot();
      };
    } catch (error) {
      console.error("Error fetching pet health records:", error);
      toast({
        title: "Error",
        description: "Failed to load health records. Please try again later.",
        variant: "destructive"
      });
      setHealthRecords([]);
      setLoadingHealthRecords(false);
      return () => {};
    }
  };
  
  // Add function to add a new health record
  const addHealthRecord = async () => {
    if (!currentUser || !selectedPet) return;
    
    try {
      // Validate input
      if (!newHealthRecord.weight || isNaN(parseFloat(newHealthRecord.weight))) {
        toast({
          title: "Invalid Weight",
          description: "Please enter a valid weight.",
          variant: "destructive"
        });
        return;
      }
      
      // Create record with timestamp
      const record = {
        ...newHealthRecord,
        timestamp: Date.now(),
        weight: parseFloat(newHealthRecord.weight)
      };
      
      // Generate a unique ID
      const recordId = `record_${Date.now()}`;
      
      // Save to Firebase
      await safeSet(`users/${currentUser.uid}/pets/${selectedPet.id}/healthRecords/${recordId}`, record);
      
      // Reset form and close dialog
      setNewHealthRecord({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        notes: '',
        activityLevel: 'normal',
        foodIntake: 'normal'
      });
      setShowAddHealthRecord(false);
      
      toast({
        title: "Health Record Added",
        description: `Health record for ${selectedPet.name} has been saved successfully.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error adding health record:", error);
      toast({
        title: "Error",
        description: "Failed to save health record. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Add function to delete a health record
  const deleteHealthRecord = async (recordId: string) => {
    if (!currentUser || !selectedPet) return;
    
    try {
      // Remove from Firebase
      await safeRemove(`users/${currentUser.uid}/pets/${selectedPet.id}/healthRecords/${recordId}`);
      
      toast({
        title: "Record Deleted",
        description: "The health record has been deleted successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error deleting health record:", error);
      toast({
        title: "Error",
        description: "Failed to delete health record. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Add function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader 
        title="Pet Profiles" 
        icon={<PawPrint size={28} />}
        description="Manage your pets' information and feeding preferences"
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Pets</h2>
        <Button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Add Pet
        </Button>
      </div>

      {pets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <PawPrint className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium mb-2">No Pets Added Yet</h3>
            <p className="text-gray-500 mb-6">Add your pets to customize their feeding schedules and track their nutrition.</p>
            <Button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2 mx-auto">
              <PlusCircle className="h-4 w-4" /> Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map(pet => (
            <Card key={pet.id} className="overflow-hidden">
              <div className="h-40 bg-gray-100 dark:bg-gray-800 relative">
                {pet.photoURL ? (
                  <img 
                    src={pet.photoURL} 
                    alt={pet.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {getPetIcon(pet.type)}
                  </div>
                )}
                <Badge className="absolute top-2 right-2 flex items-center gap-1">
                  {getPetIcon(pet.type)} {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{pet.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditPet(pet)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(pet)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                {pet.breed && <CardDescription>{pet.breed}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-2">
                {pet.age && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Age:</span>
                    <span>{pet.age} years</span>
                  </div>
                )}
                {pet.weight && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Weight:</span>
                    <span>{pet.weight} kg</span>
                  </div>
                )}
                {pet.foodType && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Food:</span>
                    <span>{pet.foodType}</span>
                  </div>
                )}
                {pet.foodAmount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Portion:</span>
                    <span>{pet.foodAmount} g</span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleEditPet(pet)}>
                  Manage Feeding Schedule
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Pet Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Pet</DialogTitle>
            <DialogDescription>
              Enter your pet's information to create a profile.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="feeding">Feeding Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pet Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Fluffy"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Pet Type</Label>
                <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  placeholder="e.g. Persian"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g. 3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g. 4.5"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo">Pet Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {formData.photoURL ? (
                      <img 
                        src={formData.photoURL} 
                        alt="Pet preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getPetIcon(formData.type)
                    )}
                  </div>
                  <label className="flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full flex items-center gap-2"
                      disabled={uploadingPhoto}
                      asChild
                    >
                      <span>
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" /> Upload Photo
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="feeding" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="foodType">Food Type</Label>
                <Input
                  id="foodType"
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleInputChange}
                  placeholder="e.g. Dry kibble, Wet food"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="foodAmount">Food Amount (grams)</Label>
                <Input
                  id="foodAmount"
                  name="foodAmount"
                  type="number"
                  value={formData.foodAmount}
                  onChange={handleInputChange}
                  placeholder="e.g. 100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedingSchedule">Feeding Schedule</Label>
                <Input
                  id="feedingSchedule"
                  name="feedingSchedule"
                  value={formData.feedingSchedule}
                  onChange={handleInputChange}
                  placeholder="e.g. Twice daily, 8am and 6pm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Special Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special dietary needs or preferences"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setAddDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAddPet}>
              Add Pet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pet Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
            <DialogDescription>
              Update your pet's information.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="feeding">Feeding</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Pet Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-type">Pet Type</Label>
                <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-breed">Breed</Label>
                <Input
                  id="edit-breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-age">Age (years)</Label>
                  <Input
                    id="edit-age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-weight">Weight (kg)</Label>
                  <Input
                    id="edit-weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-photo">Pet Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {formData.photoURL ? (
                      <img 
                        src={formData.photoURL} 
                        alt="Pet preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getPetIcon(formData.type)
                    )}
                  </div>
                  <label className="flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full flex items-center gap-2"
                      disabled={uploadingPhoto}
                      asChild
                    >
                      <span>
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" /> Change Photo
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="feeding" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-foodType">Food Type</Label>
                <Input
                  id="edit-foodType"
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-foodAmount">Food Amount (grams)</Label>
                <Input
                  id="edit-foodAmount"
                  name="foodAmount"
                  type="number"
                  value={formData.foodAmount}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-feedingSchedule">Feeding Schedule</Label>
                <Input
                  id="edit-feedingSchedule"
                  name="feedingSchedule"
                  value={formData.feedingSchedule}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Special Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="health">
              <div className="space-y-6 py-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Health Records</h3>
                  <Button 
                    onClick={() => setShowAddHealthRecord(true)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Record
                  </Button>
                </div>
                
                {loadingHealthRecords ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : healthRecords && healthRecords.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    {/* Health Stats Overview */}
                    {(() => {
                      const stats = calculateHealthStats(healthRecords);
                      if (!stats) return null;
                      
                      return (
                        <motion.div 
                          variants={itemVariants}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
                        >
                          <h4 className="text-md font-medium mb-3">Health Overview</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Average Weight</p>
                              <p className="text-xl font-bold">{stats.avgWeight} kg</p>
                            </div>
                            
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Weight Change</p>
                              <p className={`text-xl font-bold ${Number(stats.weightChange) > 0 ? 'text-green-600' : Number(stats.weightChange) < 0 ? 'text-red-600' : ''}`}>
                                {Number(stats.weightChange) > 0 ? '+' : ''}{stats.weightChange} kg
                              </p>
                            </div>
                            
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Records</p>
                              <p className="text-xl font-bold">{stats.recordCount}</p>
                            </div>
                          </div>
                          
                          {stats.weightData.length > 1 && (
                            <div className="h-48 mt-4">
                              <p className="text-sm font-medium mb-2">Weight Trend</p>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={stats.weightData}
                                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                  <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    tickMargin={5}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 12 }}
                                    tickMargin={5}
                                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                                  />
                                  <Tooltip />
                                  <Line 
                                    type="monotone" 
                                    dataKey="weight" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </motion.div>
                      );
                    })()}
                    
                    {/* Health Records List */}
                    <motion.div variants={itemVariants}>
                      <h4 className="text-md font-medium mb-3">Recent Records</h4>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {healthRecords.map((record, index) => (
                          <motion.div 
                            key={record.id}
                            variants={itemVariants}
                            className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
                            whileHover={{ scale: 1.01 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              transition: { delay: index * 0.05 } 
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{formatDate(record.date)}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteHealthRecord(record.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div className="flex items-center space-x-2">
                                <Weight className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{record.weight} kg</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Activity className="h-4 w-4 text-purple-500" />
                                <span className="text-sm capitalize">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    record.activityLevel === 'high' ? 'bg-green-100 text-green-800' :
                                    record.activityLevel === 'low' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {record.activityLevel}
                                  </span>
                                </span>
                              </div>
                            </div>
                            
                            {record.notes && (
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                {record.notes}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300 animate-pulse" />
                    <p className="text-gray-500 mb-4">No health records yet. Add your first record to start tracking {selectedPet?.name}'s health.</p>
                    <Button 
                      onClick={() => setShowAddHealthRecord(true)}
                      variant="outline"
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Record
                    </Button>
                  </motion.div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePet}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Pet Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedPet?.name} from your pets? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedPet(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePet}>
              Remove Pet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Health Record Dialog */}
      <Dialog open={showAddHealthRecord} onOpenChange={setShowAddHealthRecord}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Health Record</DialogTitle>
            <DialogDescription>
              {selectedPet ? `Record ${selectedPet.name}'s health metrics to track their well-being over time.` : 'Record your pet\'s health metrics.'}
            </DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="space-y-4 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="record-date">Date</Label>
              <Input 
                id="record-date" 
                type="date" 
                value={newHealthRecord.date}
                onChange={(e) => setNewHealthRecord({...newHealthRecord, date: e.target.value})}
              />
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="record-weight">Weight (kg)</Label>
              <Input 
                id="record-weight" 
                type="number" 
                step="0.1"
                placeholder="Enter weight in kg"
                value={newHealthRecord.weight}
                onChange={(e) => setNewHealthRecord({...newHealthRecord, weight: e.target.value})}
              />
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="record-activity">Activity Level</Label>
              <Select 
                value={newHealthRecord.activityLevel}
                onValueChange={(value) => setNewHealthRecord({...newHealthRecord, activityLevel: value})}
              >
                <SelectTrigger id="record-activity">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="record-food">Food Intake</Label>
              <Select 
                value={newHealthRecord.foodIntake}
                onValueChange={(value) => setNewHealthRecord({...newHealthRecord, foodIntake: value})}
              >
                <SelectTrigger id="record-food">
                  <SelectValue placeholder="Select food intake" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="record-notes">Notes</Label>
              <Textarea 
                id="record-notes" 
                placeholder="Any observations or concerns"
                value={newHealthRecord.notes}
                onChange={(e) => setNewHealthRecord({...newHealthRecord, notes: e.target.value})}
              />
            </motion.div>
          </motion.div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddHealthRecord(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={addHealthRecord}
              disabled={!newHealthRecord.weight || isNaN(parseFloat(newHealthRecord.weight))}
              className="bg-green-600 hover:bg-green-700"
            >
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetProfiles; 