
// Just updating the handleGooglePlaceSelected function to be more robust

const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
  if (place && place.address_components) {
    try {
      const addressComponents = extractAddressComponents(place);
      
      // Update form values with extracted address components
      if (addressComponents.street1) form.setValue('street1', addressComponents.street1, { shouldValidate: true });
      if (addressComponents.city) form.setValue('city', addressComponents.city, { shouldValidate: true });
      if (addressComponents.state) form.setValue('state', addressComponents.state, { shouldValidate: true });
      if (addressComponents.zip) form.setValue('zip', addressComponents.zip, { shouldValidate: true });
      if (addressComponents.country) form.setValue('country', addressComponents.country, { shouldValidate: true });
      
      // Trigger form validation
      form.trigger(['street1', 'city', 'state', 'zip', 'country']);
      
      toast.success('Address found and auto-filled');
      
      // Submit form values if all required fields are populated
      if (addressComponents.street1 && addressComponents.city && 
          addressComponents.state && addressComponents.zip) {
        if (onAddressSelect) {
          const values = form.getValues();
          onAddressSelect(values);
        }
      }
    } catch (error) {
      console.error('Error processing Google place selection:', error);
      toast.error('Failed to process selected address. Please try entering it manually.');
    }
  }
};
