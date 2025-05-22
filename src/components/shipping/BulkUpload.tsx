
// Just updating the handlePickupAddressSelect function to be more robust

const handlePickupAddressSelect = (address: SavedAddress | null) => {
  if (address) {
    setPickupAddress(address);
    console.log("Selected pickup address for bulk upload:", address);
    toast.success(`Using "${address.name || 'Unnamed address'}" as pickup location`);
  } else {
    toast.error('Please select a valid pickup address');
  }
};
