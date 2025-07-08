// Jada Johnson, 2209658, CIT2011, 19/6/2025

let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
let total = 0;
let itemCount = 0;

const toastSuccessMsg = '<ion-icon name="checkmark-circle"></ion-icon> <p>SYSTEM: <span></span></p>';
const toastErrorMsg = '<ion-icon name="warning"></ion-icon> <p> ERROR: <span>error</span> </p>';
const toastInvalidMsg = '<ion-icon name="close-circle"></ion-icon> <p>INVALID: <span>invalid</span></p>';

let logoutConfirmationModal;
let signedInUser = false;

let newItemQuantity = document.querySelectorAll('.new-item');
let trendingItemQuantity = document.querySelectorAll('.trending-item');
let hotItemQuantity = document.querySelectorAll('.hot-seller-item');
let limitedItemQuantity = document.querySelectorAll('.limited-item');

let categoryQuantities = {
    "new-item": 50,
    "trending-item": 25,
    "hot-seller-item": 12,
    "limited-item": 5
};

// --- Toast messages Function ---
function showToast(msgType, newText) {
    const toastBox = document.getElementById('toastBox');

    if (!toastBox) {
        console.warn("Toast Box element not found. Toast messages will not be displayed.");
    }

    let toast = document.createElement('div');
    toast.classList.add('toast');
    toast.innerHTML = msgType;

    toastBox.appendChild(toast);

    let messageSpan = toast.querySelector('span');

    if (messageSpan && newText) {
        messageSpan.innerText = newText;
    }

    if (msgType.includes('error')) {
        toast.classList.add('error');
    }

    if (msgType.includes('invalid')) {
        toast.classList.add('invalid');
    }

    setTimeout(() => {
        toast.style.animation = 'fadeOut .3s ease forwards';
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }, 4700);
}

// --- Cart Management Functions ---
function addToCart(productCard) {
    const productName = productCard.querySelector('.product-title').textContent;
    const productPriceText = productCard.querySelector('.product-price').textContent;
    const productPriceParsed = parseFloat(productPriceText.replace('$', ''));
    const imgSrc = productCard.querySelector('.product-img img') ? productCard.querySelector('.product-img img').src : productCard.querySelector(".product-img").src;

    let productCategory = null;
    const categorySpan = productCard.querySelector('.new-item, .trending-item, .hot-seller-item, .limited-item');
    
    if (categorySpan) {
        // Find the specific category class among the known ones
        for (const className in categoryQuantities) {
            if (categorySpan.classList.contains(className)) {
                productCategory = className;
                break; // Found the category, no need to check further
            }
        }
    }
    
    const existingItem = cartItems.find(item => item.productName === productName);

    if (existingItem) {
        const maxQuantity = categoryQuantities[existingItem.category] || Infinity;

        if (existingItem.quantity + 1 > maxQuantity) {
            showToast(toastErrorMsg, `Cannot add more than ${maxQuantity} of ${productName}!`);
            return; // Prevent adding if limit is reached
        }

        existingItem.quantity += 1;
    } else {
        const maxQuantity = categoryQuantities[productCategory] || Infinity;

        if (1 > maxQuantity) { // If adding the first item already exceeds the limit (e.g., limit is 0)
            showToast(toastErrorMsg, `Cannot add more than ${maxQuantity} of ${productName}!`);
            return;
        }

        cartItems.push({
            productName: productName,
            productPrice: productPriceText,
            price: productPriceParsed,
            quantity: 1,
            image: imgSrc,
            category: productCategory,
        });
    }

    updateLocalStorage();
    displayCart();
}

function displayCart() {
    const cartList = document.getElementById("cart-items");
    const totalElement = document.getElementById("total-price");
    const countElement = document.getElementById("cart-count");

    if (!cartList || !totalElement || !countElement) {
        console.error("Cart display elements not found! Make sure 'cart-items', 'total-price', and 'cart-count' IDs exist in your HTML.");
    }


    if (cartList) {
        cartList.innerHTML = '';
    }


    total = 0;
    itemCount = 0;

    if (cartItems.length > 0) {
        total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    }

    cartItems.forEach((item) => {
        if (cartList) {
            const li = document.createElement('li');
            li.classList.add('cart-item');
            li.innerHTML = `
                <img src="${item.image}" alt="${item.productName}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
                </div>

                <div class="quantity-controls">
                    <button onclick="changeQuantity('${item.productName}', -1)">-</button>
                    <button onclick="changeQuantity('${item.productName}', 1)">+</button>
                </div>

                <button class="remove" onclick="removeCartItem('${item.productName}')">x</button>
            `;
            cartList.appendChild(li);
        }
    });

    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
    if (countElement) {
        countElement.textContent = itemCount;
    }

    updateOrderSummary();
}

function updateLocalStorage() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

function changeQuantity(productName, delta) {
    const itemToUpdate = cartItems.find(item => item.productName === productName);

    if (itemToUpdate) {
        const currentQuantity = itemToUpdate.quantity;
        const potentialNewQuantity = currentQuantity + delta; // Calculate potential new quantity

        // Determine the maximum allowed quantity using the stored category
        const maxQuantity = categoryQuantities[itemToUpdate.category] || Infinity;

        // --- Logic Check for Increasing Quantity ---
        if (delta > 0 && potentialNewQuantity > maxQuantity) {
            showToast(toastErrorMsg, `Cannot add more than ${maxQuantity} of ${productName}!`);
            return; // Stop function execution if limit is hit
        }

        // This is where the quantity is actually set.
        itemToUpdate.quantity = Math.max(0, potentialNewQuantity);

        if (itemToUpdate.quantity === 0) {
            removeCartItem(productName);
        } else {
            updateLocalStorage();
            displayCart();
        }
    }
}

function removeCartItem(productName) {
    cartItems = cartItems.filter(item => item.productName !== productName);
    updateLocalStorage();
    displayCart();
    addCartToCheckout();
}

// --- Cart Sidebar Event Listeners ---
const cartIcon = document.querySelector(".cart");
const cartSidebar = document.querySelector(".cart-list");
const closeCartButton = document.querySelector(".close-btn");

if (cartIcon) {
    cartIcon.addEventListener("click", () => {
        if (cartSidebar) cartSidebar.classList.add("open-cart");
    });
}

if (closeCartButton) {
    closeCartButton.addEventListener("click", () => {
        if (cartSidebar) cartSidebar.classList.remove("open-cart");
    });
}

// --- Checkout Page Functions ---
function validInputs() {
    const cardHolderNameInput = document.getElementById("cardholder-name");
    const cardNumberInput = document.getElementById("card-number");
    const expirationYearInput = document.getElementById("expiry-year");
    const expirationMonthInput = document.getElementById("expiry-month");
    const CVVInput = document.getElementById("cvv");
    const streetInput = document.getElementById("street");
    const cityInput = document.getElementById("city");
    const stateInput = document.getElementById("state");
    const countryInput = document.getElementById("country");

    const inputsToValidate = [
        cardHolderNameInput,
        cardNumberInput,
        expirationYearInput,
        expirationMonthInput,
        CVVInput,
        streetInput,
        cityInput,
        stateInput,
        countryInput
    ];

    let allFieldsValid = true;

    inputsToValidate.forEach((input) => {
        if (input) {
            input.classList.remove("input-error");

            if (input.value.trim() === "") {
                input.classList.add("input-error");
                showToast(toastInvalidMsg, `Please enter a ${input.name || input.placeholder || "value"}`);
                allFieldsValid = false;
                return;
            }

            if (
                (input === cardNumberInput ||
                    input === CVVInput ||
                    input === expirationYearInput ||
                    input === expirationMonthInput)
            ) {
                if (isNaN(Number(input.value.trim()))) {
                    input.classList.add("input-error");
                    showToast(toastInvalidMsg, `Only numbers for ${input.name || "this field"}`);
                    allFieldsValid = false;
                    return;
                }
            }

            if (input === expirationYearInput) {
                const yearValue = Number(input.value.trim());
                const currentYear = new Date().getFullYear();
                if (yearValue < currentYear || yearValue > currentYear + 10) {
                    input.classList.add("input-error");
                    showToast(toastInvalidMsg, `A valid year (e.g., ${currentYear}-${currentYear + 10}) for expiration year.`);
                    allFieldsValid = false;
                }
            }

            if (input === expirationMonthInput) {
                const monthValue = Number(input.value.trim());
                if (monthValue < 1 || monthValue > 12) {
                    input.classList.add("input-error");
                    showToast(toastInvalidMsg, `A number between 1 and 12 for expiration month.`);
                    allFieldsValid = false;
                }
            }
        } else {
            console.warn(`Validation Warning: Input element '${input ? input.id || input.name : "unknown"}' not found.`);
        }
    });

    return allFieldsValid;
}

function clearInputs() {
    const cardHolderNameInput = document.getElementById("cardholder-name");
    const cardNumberInput = document.getElementById("card-number");
    const expirationYearInput = document.getElementById("expiry-year");
    const expirationMonthInput = document.getElementById("expiry-month");
    const zipCodeInput = document.getElementById("zip-code");
    const CVVInput = document.getElementById("cvv");
    const streetInput = document.getElementById("street");
    const townInput = document.getElementById("town");
    const cityInput = document.getElementById("city");
    const stateInput = document.getElementById("state");
    const countryInput = document.getElementById("country");

    if (cardHolderNameInput) cardHolderNameInput.value = "";
    if (cardNumberInput) cardNumberInput.value = "";
    if (expirationYearInput) expirationYearInput.value = "";
    if (expirationMonthInput) expirationMonthInput.value = "";
    if (zipCodeInput) zipCodeInput.value = "";
    if (CVVInput) CVVInput.value = "";
    if (streetInput) streetInput.value = "";
    if (townInput) townInput.value = "";
    if (cityInput) cityInput.value = "";
    if (stateInput) stateInput.value = "";
    if (countryInput) countryInput.value = "";
    
}

const clearFormButton = document.getElementById("clear-btn");
const purchaseButton = document.getElementById("purchase-btn");

if (clearFormButton) {
    clearFormButton.addEventListener("click", (e) => {
        e.preventDefault();
        clearInputs();
    });
}

function checkCart() {
    addCartToCheckout();
}

function addCartToCheckout() {
    const checkOutCartHTML = document.querySelector(".cart-item-box");
    
    if (!checkOutCartHTML) {
        return;
    }

    checkOutCartHTML.innerHTML = "";

    let checkoutTotalQuantity = 0;
    let checkoutTotalPrice = 0;

    if (cartItems.length > 0) {
        cartItems.forEach((product) => {
            const newP = document.createElement("div");
            newP.classList.add("item");
            newP.innerHTML = `
                <div class="product-card">
                    <div class="card">
                        <div class="img-box">
                            <img src="${product.image}" class="product-img" alt="${product.productName}"/>
                        </div>
                        <div class="detail">
                            <h4 class="product-name">${product.productName}</h4>
                            <div class="wrapper">
                                <div class="product-qty">
                                    <button class="decrease" data-product-name="${product.productName}">-</button>
                                    <span class="cart-item-quantity" data-product-name="${product.productName}">${product.quantity}</span>
                                    <button class="increase" data-product-name="${product.productName}">+</button>
                                </div>
                                <div class="cart-product-price">
                                    $ <span>${(product.price * product.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <button class="remove" data-product-name="${product.productName}">X</button>
                    </div>
                </div>
            `;
            checkOutCartHTML.appendChild(newP);
            checkoutTotalQuantity += product.quantity;
            checkoutTotalPrice += product.price * product.quantity;
        });

        addCheckoutEventListeners();
    } else {
        const newP = document.createElement("div");
        newP.classList.add("empty-cart-message");
        newP.innerHTML = `
            <img src="empty-cart.jpg" alt="Empty Cart">
            <p class="empty-cart-text">Phew... Must have been the wind...</p>`;

        if (checkOutCartHTML) {
            checkOutCartHTML.appendChild(newP);
        }
    }

    const totalQuantityHTML = document.getElementById("total-quantity");
    const totalPriceHTML = document.getElementById("bill");

    if (totalQuantityHTML) {
        totalQuantityHTML.innerText = checkoutTotalQuantity;
    }

    if (totalPriceHTML) {
        totalPriceHTML.innerText = `$${checkoutTotalPrice.toFixed(2)}`;
    }

    updateOrderSummary();
}

function addCheckoutEventListeners() {
    document.querySelectorAll('.item .increase').forEach(button => {
        button.onclick = function() {
            const productName = this.dataset.productName;
            changeCheckoutQuantity(productName, 1);
        };
    });

    document.querySelectorAll('.item .decrease').forEach(button => {
        button.onclick = function() {
            const productName = this.dataset.productName;
            changeCheckoutQuantity(productName, -1);
        };
    });

    document.querySelectorAll('.item .remove').forEach(button => {
        button.onclick = function() {
            const productName = this.dataset.productName;
            removeCheckoutItem(productName);
        };
    });
}

function changeCheckoutQuantity(productName, delta) {
    const productIndex = cartItems.findIndex(item => item.productName === productName);

    if (productIndex !== -1) {
        const itemToUpdate = cartItems[productIndex];
        const currentQuantity = itemToUpdate.quantity;
        const newQuantity = currentQuantity + delta;

        // Determine the maximum allowed quantity using the stored category
        const maxQuantity = categoryQuantities[itemToUpdate.category] || Infinity;

        // If increasing quantity and it would exceed the limit
        if (delta > 0 && newQuantity > maxQuantity) {
            showToast(toastErrorMsg, `Cannot add more than ${maxQuantity} of ${productName}!`);
            return; // Stop function execution
        }

        // Proceed with quantity change if within limits
        itemToUpdate.quantity = Math.max(0, newQuantity);

        if (cartItems[productIndex].quantity === 0) {
            removeCartItem(productName);
        } else {
            updateLocalStorage();
            addCartToCheckout();
            displayCart();
        }
    }
}

function removeCheckoutItem(productName) {
    removeCartItem(productName);
}

function updateOrderSummary() {
    const subtotalElement = document.getElementById("subtotal");
    const taxElement = document.getElementById("tax");
    const shippingElement = document.getElementById("shipping");
    const billElement = document.getElementById("bill");

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const tax = subtotal * 0.165;
    let shipCost = 10.0;

    if (subtotal >= 50 || cartItems.length === 0) {
        shipCost = 0;
    }

    const totalBill = subtotal + tax + shipCost;

    if (subtotalElement) {
        subtotalElement.textContent = subtotal.toFixed(2);
    }
    if (taxElement) {
        taxElement.textContent = tax.toFixed(2);
    }
    if (shippingElement) {
        shippingElement.textContent = shipCost.toFixed(2);
    }
    if (billElement) {
        billElement.textContent = `$${totalBill.toFixed(2)}`;
    }

    const totalQuantityHTML = document.getElementById("total-quantity");
    if (totalQuantityHTML) {
        const checkoutTotalQuantity = cartItems.reduce(
            (count, item) => count + item.quantity,
            0
        );
        totalQuantityHTML.innerText = checkoutTotalQuantity;
    }
}

// --- Invoice Functions ---
function populateInvoice(storedUsername) {
    const customerName = document.getElementById("customer-name");
    const customerAddress = document.getElementById("customer-addr");
    const customerZIPCode = document.getElementById("customer-zip-code");
    const customerCountry = document.getElementById("customer-country");

    const streetInput = document.getElementById("street");
    const townInput = document.getElementById("town");
    const cityInput = document.getElementById("city");
    const stateInput = document.getElementById("state");
    const countryInput = document.getElementById("country");
    const zipCodeInput = document.getElementById("zip-code");

    const userData = localStorage.getItem(storedUsername);

    if (userData) {
        const user = JSON.parse(userData);

        const name = `${user.Fname || ''} ${user.Lname || ''}`;
        const address = `${streetInput.value.trim() || ''}, ${townInput.value.trim() || ''}, ${cityInput.value.trim() || ''}, ${stateInput.value.trim() || ''}`;
        const zipCode = zipCodeInput.value.trim();
        const country = countryInput.value.trim();

        if (customerName) customerName.innerHTML = name || "N/A";
        if (customerAddress) customerAddress.innerHTML = address || "N/A";
        if (customerZIPCode) customerZIPCode.innerHTML = zipCode || "00000";
        if (customerCountry) customerCountry.innerHTML = country || "N/A";
    } else {
        if (customerName) customerName.textContent = "No Name";
        if (customerAddress) customerAddress.textContent = "No Address";
        if (customerZIPCode) customerZIPCode.textContent = "No ZIP";
        if (customerCountry) customerCountry.textContent = "No Country";
    }
}

function updateInvoiceDetails() {
    const invoiceDate = document.getElementById("invoice-date");
    const today = new Date();

    if (invoiceDate) {
        invoiceDate.textContent = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    }

    const invoiceNo = document.getElementById("invoice-number");
    let storedInvoiceNum = localStorage.getItem("invoiceNumber");

    if (invoiceNo) {
        if (storedInvoiceNum) {
            invoiceNo.textContent = storedInvoiceNum;
        } else {
            const randomInvoiceNum = Math.floor(Math.random() * 999999999) + 1;
            invoiceNo.textContent = randomInvoiceNum;
            localStorage.setItem("invoiceNumber", randomInvoiceNum.toString());
        }
    }

    const invoiceItemsBody = document.getElementById("invoice-items-body");

    if (!invoiceItemsBody) {
        console.error("Invoice items body element not found! Make sure you have a <tbody> with id='invoice-items-body'.");
        return;
    }

    invoiceItemsBody.innerHTML = ""; // Clear any existing items in the invoice body

    let totalItemsCount = 0;
    let subtotalAmount = 0;

    // Loop through each item in the cartItems array to populate the invoice table
    cartItems.forEach((item) => {
        const row = document.createElement("tr");

        const itemAmount = item.price * item.quantity;
        totalItemsCount += item.quantity;
        subtotalAmount += itemAmount;

        row.innerHTML = `
            <td>${item.productName}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td class="text-end">$${itemAmount.toFixed(2)}</td>
        `;

        invoiceItemsBody.appendChild(row);
    });

    const taxRate = 0.165; // 16.5% tax
    const taxAmount = subtotalAmount * taxRate;

    let shippingCost = 10.0;

    // Apply free shipping if subtotal is $50 or more, or if cart is empty
    if (subtotalAmount >= 50 || cartItems.length === 0) {
        shippingCost = 0;
    }

    const totalBill = subtotalAmount + taxAmount + shippingCost;

    // --- Update the summary details at the bottom of the invoice ---
    const invoiceTotalItemsElement = document.getElementById("invoice-items");
    const invoiceSubtotalElement = document.getElementById("invoice-subtotal");
    const invoiceTaxElement = document.getElementById("invoice-tax");
    const invoiceShippingElement = document.getElementById("invoice-shipping");
    const invoiceGrandTotalElement = document.getElementById("invoice-total");

    if (invoiceTotalItemsElement) {
        invoiceTotalItemsElement.textContent = totalItemsCount;
    } else {
        console.warn("Element with ID 'invoice-items' not found for invoice summary.");
    }

    if (invoiceSubtotalElement) {
        invoiceSubtotalElement.textContent = `$${subtotalAmount.toFixed(2)}`;
    } else {
        console.warn("Element with ID 'invoice-subtotal' not found for invoice summary.");
    }

    if (invoiceTaxElement) {
        invoiceTaxElement.textContent = `$${taxAmount.toFixed(2)}`;
    } else {
        console.warn("Element with ID 'invoice-tax' not found for invoice summary.");
    }

    if (invoiceShippingElement) {
        invoiceShippingElement.textContent = `$${shippingCost.toFixed(2)}`;
    } else {
        console.warn("Element with ID 'invoice-shipping' not found for invoice summary.");
    }

    if (invoiceGrandTotalElement) {
        invoiceGrandTotalElement.textContent = `$${totalBill.toFixed(2)}`;
    } else {
        console.warn("Element with ID 'invoice-total' not found for invoice summary.");
    }
}

function togglePurchaseModal() {
    const blur = document.getElementById("blur");
    const purchaseModal = document.getElementById("popup");
    const confirmMessage = document.getElementById("confirmation-message");
    const orderModal = document.getElementById("purchase-confirmed");

    if (blur) blur.classList.add("active");
    if (purchaseModal) purchaseModal.classList.add("active");

    if (confirmMessage) {
        confirmMessage.style.transform = "translateX(0%)";
        confirmMessage.style.opacity = 1;
    }

    if (orderModal) {
        orderModal.style.transform = "translateX(150%)";
        orderModal.style.opacity = 0;
    }
}

// Event Listeners for Modals (Purchase/Invoice)
const closeBtn = document.querySelector(".modal-btn-close");
const confirmBtn = document.querySelector(".modal-btn-confirm");
const viewInvoiceBtn = document.querySelector(".modal-btn-confirm-invoice");
const exitBtn = document.querySelector(".modal-btn-exit");

if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        const purchaseModal = document.getElementById("popup");
        const blur = document.getElementById("blur");
        if (purchaseModal) purchaseModal.classList.remove("active");
        if (blur) blur.classList.remove("active");
    });
}

if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
        const loggedInUser = JSON.parse(localStorage.getItem("user"));
        let currentUsername = "";
        if (loggedInUser && loggedInUser.username) {
            currentUsername = loggedInUser.username;
        }

        const confirmMessage = document.getElementById("confirmation-message");
        const orderModal = document.getElementById("purchase-confirmed");

        if (validInputs()) {
            populateInvoice(currentUsername);
            updateInvoiceDetails();
            if (confirmMessage) confirmMessage.style.transform = "translateX(-100%)";
            if (confirmMessage) confirmMessage.style.opacity = 0;
            if (orderModal) orderModal.style.transform = "translateX(0%)";
            if (orderModal) orderModal.style.opacity = 1;
        } else {
            showToast(toastErrorMsg, "Please fix the errors before proceeding.");
        }
    });
}

if (viewInvoiceBtn) {
    viewInvoiceBtn.addEventListener("click", () => {
        updateInvoiceDetails();
        const purchaseModal = document.getElementById("popup");
        const invoiceModal = document.getElementById("invoiceModal");
        const blur = document.getElementById("blur");
        if (purchaseModal) purchaseModal.classList.remove("active");
        if (invoiceModal) invoiceModal.classList.add("active");
        if (blur) blur.classList.add("active");
    });
} else {
    console.warn("Warning: 'View Invoice' button (ID: modal-btn-confirm-invoice) not found.");
}

window.printInvoice = function() {
    window.print();
};

function clearCheckoutForm() {
    try {
        cartItems.length = 0;
        localStorage.removeItem('cartItems');

        displayCart();
        addCartToCheckout();
        updateOrderSummary();

        clearInputs();

        showToast(toastSuccessMsg, 'Order placed successfully!');
        
    } catch (error) {
        console.error("Error clearing checkout form:", error);
        showToast(toastErrorMsg, "An error occured while clearing the form!");
    }
}

// --- Login/Register Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    checkCart(); // Also ensures checkout cart is populated on checkout page

    // Login/Register Modal elements
    const loginRegisterModal = document.getElementById('loginRegisterModal');

    const formCancelBtn = document.querySelector('.form-cancel');

    const loginForm = document.getElementById('login-form') || document.querySelector(".login-form");
    const registerForm = document.getElementById('register-form') || document.querySelector(".register-form");

    const loginBtn = document.querySelector("#login");
    const registerBtn = document.querySelector("#register");

    const signInBtn = document.querySelector("#sign-in-btn");
    const signUpBtn = document.querySelector("#sign-up-btn");

    const alreadyHaveAccountLink = document.querySelector('.register-form .forgot-pass a');

    // Ensure initial state for login/register modal
    if (loginRegisterModal) loginRegisterModal.style.display = 'none';
    if (loginBtn) loginBtn.style.backgroundColor = "#527125";

    if (purchaseButton) {
        purchaseButton.addEventListener("click", (e) => {
        
        e.preventDefault();

        if (!signedInUser) {
            showToast(toastErrorMsg, "Please sign in to purchase this cart!");
            showLoginRegisterModal();
            return;
        }

        if (cartItems.length === 0) {
            showToast(toastErrorMsg, "Can't purchase an empty cart!");
            return;
        }

        if (!validInputs()) {
            showToast(toastErrorMsg, "Please fix the form errors before proceeding.");
            return;
        }

        togglePurchaseModal();
    });
    }

    function showUsername() {
    let currentOpenModalBtn = document.getElementById('openModalBtn');

    if (!currentOpenModalBtn) {
        console.error("ERROR: openModalBtn element not found in showUsername!");
        return; // Add return to prevent errors if element is missing
    }

    const newButton = currentOpenModalBtn.cloneNode(true);
    currentOpenModalBtn.parentNode.replaceChild(newButton, currentOpenModalBtn);
    currentOpenModalBtn = newButton;

    const loggedInUserString = localStorage.getItem("user");

    currentOpenModalBtn.removeEventListener('click', handleUserButtonClick);
    currentOpenModalBtn.removeEventListener('click', showLoginRegisterModal);

    if (loggedInUserString) {
        try {
            signedInUser = true;
            const user = JSON.parse(loggedInUserString);
            const currentTime = new Date().getTime();

            if (user && user.username && user.loginTime && user.sessionDuration &&
                (currentTime - user.loginTime < user.sessionDuration)) {
                // Session is still valid
                currentOpenModalBtn.textContent = user.username;
                currentOpenModalBtn.addEventListener('click', handleUserButtonClick); // User click opens logout confirmation
            } else {
                // Session expired or data corrupted, log out the user
                logoutUser(true, false); // Log out immediately without modal, don't show toast again
                currentOpenModalBtn.textContent = "Login/Register";
                currentOpenModalBtn.addEventListener('click', showLoginRegisterModal);
            }
        } catch (e) {
            console.error("Error parsing user data from localStorage in showUsername:", e);
            logoutUser(true, false); // Log out immediately without modal, don't show toast again
            currentOpenModalBtn.textContent = "Login/Register";
            currentOpenModalBtn.addEventListener('click', showLoginRegisterModal);
        }
    } else {
        // User is not logged in, show default text
        currentOpenModalBtn.textContent = "Login/Register";
        currentOpenModalBtn.addEventListener('click', showLoginRegisterModal);
    }
    }

    // Function to open the logout confirmation modal
function showLogoutConfirmationModal() {
    const blur = document.getElementById("blur");
    if (logoutConfirmationModal) {
        logoutConfirmationModal.classList.add('active');
        if (blur) blur.classList.add("active");
    }
}

// Function to hide the logout confirmation modal
function hideLogoutConfirmationModal() {
    const blur = document.getElementById("blur");
    if (logoutConfirmationModal) {
        logoutConfirmationModal.classList.remove('active');
        if (blur) blur.classList.remove("active");
    }
}

// Original logoutUser function, slightly modified
function logoutUser(confirmed = false, showToastMsg = true) {
    // If not confirmed via the modal, show the modal
    if (!confirmed) {
        showLogoutConfirmationModal();
        return; // Stop execution here, wait for modal confirmation
    }

    // If confirmed (or if called with confirmed = true initially, like from session expiry)
    localStorage.removeItem("user");
    localStorage.removeItem("cartItems");

    cartItems = [];
    displayCart();

    signedInUser = false;

    if (showToastMsg) {
        showToast(toastSuccessMsg, "Logged out successfully!");
    }

    // After logging out, update the UI to show "Login/Register"
    showUsername();

    // Also ensure any other modals like login/register are hidden
    hideLoginRegisterModal();
    hideLogoutConfirmationModal(); // Hide the logout confirmation modal itself
}

// Function to handle the click on the "Yes, Log Out" button
function confirmLogout() {
    logoutUser(true); // Call logoutUser with confirmed = true
}

// Function to handle the click on the "Cancel" button
function cancelLogout() {
    hideLogoutConfirmationModal(); // Just hide the modal
}

// This function will now simply open the logout confirmation modal
function handleUserButtonClick() {
    showLogoutConfirmationModal();
}

    // Helper functions for login/register modal display
    function showLoginRegisterModal() {

        if (loginRegisterModal) loginRegisterModal.style.display = 'flex';
        if (loginBtn) loginBtn.style.backgroundColor = "#527125";
        if (registerBtn) registerBtn.style.backgroundColor = "rgba(255, 255, 255, .2)";

        if (loginForm) {
            loginForm.style.left = "50%";
            loginForm.style.opacity = 1;
        }
        if (registerForm) {
            registerForm.style.left = "-50%";
            registerForm.style.opacity = 0;
        }
    }

    function hideLoginRegisterModal() {
      
        if (loginRegisterModal) loginRegisterModal.style.display = 'none';

        if (loginForm) {
            loginForm.style.left = "50%";
            loginForm.style.opacity = 1;
        }

        if (registerForm) {
            registerForm.style.left = "-50%";
            registerForm.style.opacity = 0;
        }
    }

    // Event listeners for opening and closing login/register modal
    if (formCancelBtn) {
        formCancelBtn.addEventListener('click', hideLoginRegisterModal);
    }

    // Close modal when clicking outside the forms
    if (loginRegisterModal) {
        loginRegisterModal.addEventListener('click', (event) => {
            if (event.target === loginRegisterModal) {
                hideLoginRegisterModal();
            }
        });
    }

    // Login form activation
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (loginBtn) loginBtn.style.backgroundColor = "#527125";
            if (registerBtn) registerBtn.style.backgroundColor = "rgba(255, 255, 255, .2)";
            if (loginForm) {
                loginForm.style.left = "50%";
                loginForm.style.opacity = 1;
            }
            if (registerForm) {
                registerForm.style.left = "-50%";
                registerForm.style.opacity = 0;
            }
        });
    }

    // Registration form activation
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            if (registerBtn) registerBtn.style.backgroundColor = "#527125";
            if (loginBtn) loginBtn.style.backgroundColor = "rgba(255, 255, 255, .2)";
            if (loginForm) {
                loginForm.style.left = "150%";
                loginForm.style.opacity = 0;
            }
            if (registerForm) {
                registerForm.style.left = "50%";
                registerForm.style.opacity = 1;
            }
        });
    }

    // "Already have an account? Login Now!" link
    if (alreadyHaveAccountLink) {
        alreadyHaveAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginBtn) loginBtn.style.backgroundColor = "#527125";
            if (registerBtn) registerBtn.style.backgroundColor = "rgba(255, 255, 255, .2)";
            if (loginForm) {
                loginForm.style.left = "50%";
                loginForm.style.opacity = 1;
            }
            if (registerForm) {
                registerForm.style.left = "-50%";
                registerForm.style.opacity = 0;
            }
        });
    }

    // Sign In (Login) form submission (Your provided code snippet)
    if (signInBtn && loginForm) {
        signInBtn.addEventListener('click', function(e) {
            e.preventDefault();

            var usernameInput = loginForm.querySelector('input[type="text"]').value;
            var passwordInput = loginForm.querySelector('input[type="password"]').value;

            var existingUser = localStorage.getItem(usernameInput);

            if (existingUser) {
                var parsedUser = JSON.parse(existingUser);
                if (parsedUser.password === passwordInput) {

                    const userWithTimestamp = {
                        ...parsedUser, // Use spread operator to copy existing user properties
                        loginTime: new Date().getTime(),
                        sessionDuration: 3 * 60 * 60 * 1000 // user has 3 hours on-site
                    };

                    localStorage.setItem("user", JSON.stringify(userWithTimestamp));
                    showToast(toastSuccessMsg, "Login successful!");
                    hideLoginRegisterModal();
                    showUsername();

                } else {
                    showToast(toastInvalidMsg, "Incorrect password!");
                }
            } else {
                showToast(toastErrorMsg, "User Not Found!");
            }
        });
    }

    // Sign Up (Register) form submission
    if (signUpBtn && registerForm) {
        signUpBtn.addEventListener('click', function(e) {
            e.preventDefault();

            var userFirstName = document.getElementById("first-name").value;
            var userLastName = document.getElementById("last-name").value;
            var userEmail = document.getElementById("email").value;
            var userDOB = document.getElementById("dob").value;
            var regUsername = registerForm.querySelector('input[type="text"][placeholder="Username..."]').value;
            var regPassword = registerForm.querySelector('input[type="password"]').value;

            const newUser = {
                Fname: userFirstName,
                Lname: userLastName,
                email: userEmail,
                dob: userDOB,
                username: regUsername,
                password: regPassword
            };

            if (localStorage.getItem(regUsername)) {
                showToast(toastErrorMsg, "Username already exists! Please choose a different one.");
                return;
            }

            localStorage.setItem(regUsername, JSON.stringify(newUser));
            showToast(toastSuccessMsg, "Registration successful! Please login!");

            if (loginBtn) loginBtn.style.backgroundColor = "#527125";
            if (registerBtn) registerBtn.style.backgroundColor = "rgba(255, 255, 255, .2)";
            if (loginForm) {
                loginForm.style.left = "50%";
                loginForm.style.opacity = 1;
            }
            if (registerForm) {
                registerForm.style.left = "-50%";
                registerForm.style.opacity = 0;
                registerForm.reset();
            }
        });
    }

    // Invoice modal elements
    const invoiceModalElement = document.getElementById("invoiceModal");
    const closeInvoiceButton = document.querySelector(".invoice-close-button");

    if (closeInvoiceButton) {
        closeInvoiceButton.onclick = function() {
            if (invoiceModalElement) invoiceModalElement.classList.remove("active");
            const blur = document.getElementById("blur");
            if (blur) blur.classList.remove("active");

            clearCheckoutForm();
        };
    }

    if (exitBtn) {
        exitBtn.addEventListener("click", () => {
        const purchaseModal = document.getElementById("popup");

        if (invoiceModalElement) invoiceModalElement.classList.remove("active");
        const blur = document.getElementById("blur");
        if (blur) blur.classList.remove("active");
        if (purchaseModal) purchaseModal.classList.remove("active");

        clearCheckoutForm();
    });
    }

    // Get a reference to the logout modal
    logoutConfirmationModal = document.getElementById('log-out');

    // Add event listeners for the logout modal's buttons
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', confirmLogout);
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', cancelLogout);
    }

    // Optional: Close modal when clicking outside
    if (logoutConfirmationModal) {
        logoutConfirmationModal.addEventListener('click', (event) => {
            if (event.target === logoutConfirmationModal) {
                hideLogoutConfirmationModal();
            }
        });
    }

    showUsername(); // Initial call to set the button state
});
