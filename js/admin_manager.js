// Load services on page load
document.addEventListener("DOMContentLoaded", loadServices);

async function loadServices() {
  try {
    const response = await fetch(`${API_BASE_URL}/services/`);
    const services = await response.json();

    const tbody = document.getElementById("serviceList");
    tbody.innerHTML = "";

    services.forEach((service) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${service.service_id}</td>
                <td>${service.service_name}</td>
                <td>${service.description}</td>
                <td>
                    <input type="number" id="price-${service.service_id}" value="${service.base_price}" step="0.01">
                </td>
                <td>
                    <button onclick="updatePrice(${service.service_id})">Update Price</button>
                    <button onclick="deleteService(${service.service_id})" style="background-color: #dc3545;">Delete</button> 
                </td>
            `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading services:", error);
    showToast(
      "Error",
      "Failed to load services. Ensure backend is running.",
      "error",
    );
  }
}

async function updatePrice(serviceId) {
  const newPrice = document.getElementById(`price-${serviceId}`).value;

  try {
    // 1. Get current details
    const getRes = await fetch(`${API_BASE_URL}/services/${serviceId}`);
    const serviceData = await getRes.json();

    if (!serviceData) {
      showToast("Error", "Service not found", "error");
      return;
    }

    // 2. Update price
    serviceData.base_price = parseFloat(newPrice);

    // 3. Send update
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(serviceData),
    });

    if (response.ok) {
      showToast("Success", "Price updated successfully!", "success");
      loadServices(); // Refresh to be sure
    } else {
      const err = await response.json();
      showToast("Update Failed", err.detail || "Something went wrong", "error");
    }
  } catch (error) {
    console.error("Error updating price:", error);
    showToast("Error", "Failed to update price on server.", "error");
  }
}

async function deleteService(serviceId) {
  // Ask confirmation before deleting
  const confirmDelete = confirm(
    "Are you sure you want to delete this service?",
  );

  if (!confirmDelete) {
    return; // Stop if user cancels
  }

  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showToast("Success", "Service deleted successfully!", "success");
      loadServices(); // Refresh the table
    } else {
      const err = await response.json();
      showToast(
        "Deletion Failed",
        err.detail || "Error deleting service",
        "error",
      );
    }
  } catch (error) {
    console.error("Error deleting service:", error);
    showToast("Server Error", "Could not connect to server.", "error");
  }
}

async function createService() {
  const name = document.getElementById("newServiceName").value;
  const desc = document.getElementById("newServiceDesc").value;
  const type = document.getElementById("newVehicleType").value;
  const price = document.getElementById("newServicePrice").value;

  if (!name || !price) {
    showToast(
      "Input Required",
      "Please enter at least a name and price.",
      "info",
    );
    return;
  }

  const newService = {
    service_name: name,
    description: desc || "",
    vehicle_type: type || "All",
    base_price: parseFloat(price),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/services/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newService),
    });

    if (response.ok) {
      showToast("Success", "Service added successfully!", "success");
      // Clear inputs
      document.getElementById("newServiceName").value = "";
      document.getElementById("newServiceDesc").value = "";
      document.getElementById("newVehicleType").value = "";
      document.getElementById("newServicePrice").value = "";

      // Reload list
      loadServices();
    } else {
      const err = await response.json();
      showToast(
        "Creation Failed",
        err.detail || "Could not create service",
        "error",
      );
    }
  } catch (e) {
    console.error("Create service failed", e);
    showToast("Creation Failed", "Error connecting to server.", "error");
  }
}
