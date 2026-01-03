

// Load services on page load
document.addEventListener('DOMContentLoaded', loadServices);

async function loadServices() {
    try {
        const response = await fetch(`${API_BASE_URL}/services/`);
        const services = await response.json();

        const tbody = document.getElementById('serviceList');
        tbody.innerHTML = '';

        services.forEach(service => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${service.service_id}</td>
                <td>${service.service_name}</td>
                <td>${service.description}</td>
                <td>
                    <input type="number" id="price-${service.service_id}" value="${service.base_price}" step="0.01">
                </td>
                <td>
                    <button onclick="updatePrice(${service.service_id})">Update Price</button>
                    <!-- <button onclick="deleteService(${service.service_id})" style="background-color: #dc3545;">Delete</button> -->
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading services:', error);
        alert('Failed to load services. Ensure backend is running.');
    }
}

async function updatePrice(serviceId) {
    const newPrice = document.getElementById(`price-${serviceId}`).value;

    // We first need to get the full service object because the API expects a complete ServiceInput
    // Alternatively, we can just send the full object if we had it. 
    // For simplicity, we'll fetch the single service, update the price, and send it back.

    try {
        // 1. Get current details
        const getRes = await fetch(`${API_BASE_URL}/services/${serviceId}`);
        const serviceData = await getRes.json();

        if (!serviceData) {
            alert("Service not found");
            return;
        }

        // 2. Update price
        serviceData.base_price = parseFloat(newPrice);

        // 3. Send update
        const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(serviceData)
        });

        if (response.ok) {
            alert('Price updated successfully!');
            loadServices(); // Refresh to be sure
        } else {
            const err = await response.json();
            alert('Failed to update: ' + JSON.stringify(err));
        }
    } catch (error) {
        console.error('Error updating price:', error);
        alert('Error updating price.');
    }
}
async function createService() {
    const name = document.getElementById("newServiceName").value;
    const desc = document.getElementById("newServiceDesc").value;
    const type = document.getElementById("newVehicleType").value;
    const price = document.getElementById("newServicePrice").value;

    if (!name || !price) {
        alert("Please enter at least a name and price.");
        return;
    }

    const newService = {
        service_name: name,
        description: desc || "",
        vehicle_type: type || "All",
        base_price: parseFloat(price)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/services/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newService)
        });

        if (response.ok) {
            alert("Service added successfully!");
            // Clear inputs
            document.getElementById("newServiceName").value = "";
            document.getElementById("newServiceDesc").value = "";
            document.getElementById("newVehicleType").value = "";
            document.getElementById("newServicePrice").value = "";

            // Reload list
            loadServices();
        } else {
            const err = await response.json();
            alert("Failed to create service: " + JSON.stringify(err));
        }
    } catch (e) {
        console.error("Create service failed", e);
        alert("Error connecting to server.");
    }
}
