const apiUrl = "https://api.unsplash.com/photos/random/?count=1&orientation=landscape";
const baseUrl = "https://unsplash.com/photos/";
let currentImageData = {};

const msg = { imageSaved: "Image Saved", imageRemoved: "Image Removed" };
const attribution = document.querySelector(".attribution");
const savedImageContainer = document.querySelector(".saved-image-container");
const mainImageContainer = document.querySelector(".main-image-container");
const searchInput = document.querySelector(".search-input");
const searchForm = document.querySelector(".search-form");
const emailForm = document.querySelector(".add-email-form");
const emailInput = document.querySelector(".add-email-input");
const emailSelect = document.querySelector(".email-select");

// turn off browser validation for email input

emailForm.noValidate = true;

/********************/
/* Handler functions */
/********************/

// get image data from unsplash api and display on page

const onSearchSubmitHandler = async () => {
  const parent = mainImageContainer;
  const url = createSearchUrl();

  // remove existing image from page
  if (checkMainImageExists()) {
    mainImageContainer.removeChild(mainImageContainer.firstChild);
  }

  // remove existing error message from page if it sexists
  if (checkImageErrorExists()) {
    mainImageContainer.removeChild(mainImageContainer.firstChild);
  }

  try {
    const [imageData] = await getImageData(url);
    setCurrentImageData(imageData);
    const image = createImage(imageData, ["pic-wrapper"], "new");
    addImageToDom(image, parent);
    addAttribution(currentImageData);
  } catch (err) {
    if (err === 404) {
      showMainImageError(`No images for ${getSearchTerm()} found :(`);
    } else if (err === 403) {
      showMainImageError(`Oh Noes!!! API rate limit exceeded`);
    } else {
      console.log(err);
    }
  }
};

// remove existing images from saved images container and load saved images for selected email

onSelectChangeHandler = (e) => {
  clearSavedImages();
  loadSavedImages();
};

// on page load - check if accounts array exists in local storage, if not, create it. Adds any email addresses to select list and loads saved images for first email in list. Displays image in main image container.

onPageLoadHandler = () => {
  console.log("dom content loaded");
  // check if account array exists in local storage - if not, create it
  if (!localStorage.getItem("accounts")) {
    localStorage.setItem("accounts", JSON.stringify([]));
  }
  // if no accounts exist,  no need to load select list
  if (getAccountsFromLocalStorage().length === 0) {
    onSearchSubmitHandler();
    return;
  } else {
    const emailAddresses = getEmailAddresses();
    removeDefaultOption();
    emailAddresses.sort().forEach((email) => {
      addEmailToSelect(email);
    });

    loadSavedImages();
  }

  onSearchSubmitHandler();
};

// save image to account and add to saved images container on page

onSaveImageHandler = (e) => {
  if (!checkEmailOnSave(emailSelect)) {
    emailInput.setCustomValidity("No accounts avaialble - please add an account");
    emailInput.reportValidity();
    return console.log("No email selected");
  } else {
    emailInput.setCustomValidity("");
  }

  if (!checkMainImageExists()) {
    return showToast("No image to save");
  }
  const account = getAccountFromLocalStorage(getEmailFromSelect());
  const image = getCurrentImageData();

  if (checkImageIsSaved(image, account)) {
    return console.log("Image already saved");
  }
  saveImageToAccount(account, image);
  const savedImage = createImage(currentImageData, ["pic-wrapper", "saved-image"], "saved");
  try {
    addImageToDom(savedImage, savedImageContainer);
    showToast(msg.imageSaved);
  } catch (err) {
    console.log(err);
  }

  onSearchSubmitHandler();
};

/********************/
/* Helper functions */
/********************/

// create image html - type is either new or saved. New images are displayed in main image container, saved images are displayed in saved images container and are smaller in size.

const createImageHtml = (imageData, type) => {
  const {
    id,
    alt_description: altDescription,
    urls: { raw },
  } = imageData;

  const regular = raw + "&w=600&h=400&fit=crop";
  // const medium = raw + "&w=600&h=400&fit=crop";
  const small = raw + "&w=400&h=300&fit=crop";
  const xs = raw + "&w=300&h=200&fit=crop";
  const image = `<picture>

  ${type === "new" ? `<source media="(min-width:768px)" srcset="${regular}">` : ""}
  ${type === "new" ? `<source media="(min-width:400px)" srcset="${small}">` : ""}
      <img src="${xs}" data-pic-id=${id} alt="${altDescription}">
  </picture>`;
  return image;
};

// add image to dom - parent is the container to add the image to

const addImageToDom = (image, parent) => {
  parent.insertAdjacentElement("afterbegin", image);
  image.addEventListener("load", (e) => {
    console.log(e.target);
  });
};

// check if main image exists on page
const checkMainImageExists = () => {
  return mainImageContainer.querySelector(".main-image-container > .pic-wrapper") ? true : false;
};

// get the current image data - updates on each search
const getCurrentImageData = () => {
  return currentImageData;
};

// store the current image data
const setCurrentImageData = (imageData) => {
  currentImageData = imageData;
};

const createImage = (imageData, classList, imageType) => {
  const image = createImageHtml(imageData, imageType);
  const wrappedImage = createDivWrapper(image, classList);
  if (imageType === "saved") {
    const overLay = createImageOverlay(imageData, imageType);
    wrappedImage.insertAdjacentElement("beforeend", overLay);
  }
  return wrappedImage;
};

const createDivWrapper = (element, classList) => {
  const div = document.createElement("div");
  div.classList.add(...classList);
  div.innerHTML = element;
  return div;
};

createImageOverlay = (imageData, itemType) => {
  const {
    id,
    user: { name },
    user: { username },
  } = imageData;
  const div = document.createElement("div");
  div.classList.add("saved-image-overlay");
  div.innerHTML = `<span title="See @${name}'s profile on Unsplash"><a href="https://unsplash.com/@${username}"   target="_blank">@${name}</a></span><a class ="link-button button hidden" href="${baseUrl}${id}" target="_blank">View on Unsplash</a>
<span class="remove-button button hidden" data-account="${getEmailFromSelect()}" data-photo-id=${id} } ">Remove Image</span>`;

  return div;
};

const createSearchUrl = () => {
  const searchTerm = searchInput.value.trim();
  return (url = searchTerm != "" ? `${apiUrl}&query=${encodeURIComponent(searchTerm)}` : apiUrl);
};

// return current search term
const getSearchTerm = () => {
  return searchInput.value.trim();
};

// load saved images for selected email
const loadSavedImages = () => {
  const account = getAccountFromLocalStorage(getEmailFromSelect());
  const parent = savedImageContainer;
  const imagesArray = account.images;
  if (imagesArray.length === 0) {
    return;
  }
  imagesArray.forEach((image) => {
    const wrappedImage = createImage(image, ["pic-wrapper", "saved-image"], "saved");
    addImageToDom(wrappedImage, parent);
  });
};

// clear saved images container
const clearSavedImages = () => {
  if (savedImageContainer.hasChildNodes()) {
    savedImageContainer.innerHTML = "";
  }
};

// used for showing toast message when image is deleted / saved etc

const showToast = (msg, duration = 3000) => {
  // create the toast element
  const toastElement = document.createElement("p");
  toastElement.innerHTML = msg;

  toastElement.classList.add("toast");

  // function that will adjust the toast's position when the user scrolls

  function scrollToast() {
    toastElement.style.top = scrollY + 10 + "px";
  }

  // add it to the dom
  document.body.appendChild(toastElement);

  requestAnimationFrame(function () {
    toastElement.style.opacity = "1";
    toastElement.style.top = scrollY + 10 + "px";
    window.addEventListener("scroll", scrollToast);
  });

  // start fading it out 500ms before removing it
  setTimeout(function () {
    toastElement.style.opacity = "0";
  }, duration - 500);

  // remove it after the duration is over
  setTimeout(function () {
    document.body.removeChild(toastElement);
    window.removeEventListener("scroll", scrollToast);
  }, duration);
};

/********************/
/* Select functions */
/********************/

/* fire change event on select - example use is when emails are 
added to select list on page load, this event is fired so that 
we can call the handler that loads a users stored images */

const fireSelectChangeEvent = (select) => {
  select.dispatchEvent(new Event("change"));
};

// remove default option from select list - default option is used to show placeholder text
const removeDefaultOption = () => {
  const defaultOption = emailSelect.querySelector("option[value='default-option']");
  if (defaultOption) {
    emailSelect.removeChild(defaultOption);
  }
};

// check if default option exists in select list
const checkDefaultOptionExists = () => {
  const defaultOption = emailSelect.querySelector("option[value='default-option']");
  return defaultOption ? true : false;
};

// set selected option in select list
const setSelected = (select, value) => {
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value === value) {
      select.options[i].selected = true;
      return;
    }
  }
};

// get selected email from select list
getEmailFromSelect = () => {
  return emailSelect.value;
};

/*******************/
/* Email functions */
/*******************/

// get all email addresses from local storage
const getEmailAddresses = () => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.map((account) => account.email);
};

// check if any email addresses exist in select list
const checkEmailOnSave = (email) => {
  if (checkDefaultOptionExists()) {
    return false;
  }
  return getEmailFromSelect();
};

// check if email syntax is valid
const checkEmailIsValid = (email) => {
  const emailRegex = new RegExp(/^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}$/);
  return emailRegex.test(email);
};

// check if submitted email already exists
const checkEmailExists = (email) => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.some((account) => account.email === email.toLowerCase());
};

// add email to select list
const addEmailToSelect = (email) => {
  const option = document.createElement("option");
  option.value = email;
  option.textContent = email;
  emailSelect.appendChild(option);
};

// check if email syntax is valid and does not already exist
const validateEmail = (email) => {
  emailInput.setCustomValidity("");
  // check if email syntax is valid
  if (!checkEmailIsValid(email)) {
    emailInput.setCustomValidity("Please enter a valid email address");
    emailInput.reportValidity();
    return false;
  } else {
    emailInput.setCustomValidity("");
  }

  // check if email exists in local storage
  if (checkEmailExists(email)) {
    emailInput.setCustomValidity("That account already exists");
    emailInput.reportValidity();
    return false;
  } else {
    emailInput.setCustomValidity("");
  }

  return true;
};

const addEmail = () => {
  const email = emailInput.value.trim();

  if (!validateEmail(email)) {
    console.log(emailInput.checkValidity());
    console.log("Email is not valid");
    return;
  }

  // email is ok, create account
  const account = createAccount(email);

  // add account to local storage
  addAccountToLocalStorage(account);

  // add account email to select list
  addEmailToSelect(email);

  // remove default option if it exists
  if (checkDefaultOptionExists()) {
    removeDefaultOption();
  }

  //  set this email to selected
  setSelected(emailSelect, email);

  // clear email input

  emailInput.value = "";

  // fire change event on select
  fireSelectChangeEvent(emailSelect);

  showToast("Account added");
};

/*********************/
/* Account Functions */
/*********************/

// add account to local storage
const addAccountToLocalStorage = (account) => {
  const accounts = getAccountsFromLocalStorage();
  accounts.push(account);
  localStorage.setItem("accounts", JSON.stringify(accounts));
};

// check if image has already been saved to account
const checkImageIsSaved = (image, account) => {
  if (account.images.some((savedImage) => savedImage.id === image.id)) {
    return true;
  }
  return false;
};

const createAccount = (email) => {
  return { email: email.toLowerCase(), images: [] };
};

// get single account from local storage
const getAccountFromLocalStorage = (email) => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.find((account) => account.email === email);
};

// get all accounts from local storage
const getAccountsFromLocalStorage = () => {
  const accounts = localStorage.getItem("accounts") ? JSON.parse(localStorage.getItem("accounts")) : [];
  return accounts;
};

const saveImageToAccount = (account, image) => {
  account.images.push(image);
  updateAccountInLocalStorage(account);
};

const removeSavedImage = (e) => {
  const account = getAccountFromLocalStorage(e.target.dataset.account);
  const imageId = e.target.dataset.photoId;
  const index = account.images.findIndex((image) => image.id === imageId);
  account.images.splice(index, 1);
  updateAccountInLocalStorage(account);
  try {
    e.target.parentNode.parentNode.remove();
    showToast(msg.imageRemoved);
  } catch (err) {
    console.log(err);
  }
};

const updateAccountInLocalStorage = (account) => {
  const accounts = getAccountsFromLocalStorage();
  const index = accounts.findIndex((acc) => acc.email === account.email);
  accounts[index] = account;
  localStorage.setItem("accounts", JSON.stringify(accounts));
};

/*****************/
/* APi Retrieval */
/*****************/

const getJson = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Client-ID AGXrZudMPTQjYsYx-Nm7S6JrR_0slnKlmu6ctmxZTaU",
    },
  });
  if (!response.ok) {
    return Promise.reject(response.status);
  }
  return await response.json();
};

const getImageData = async (url) => {
  try {
    return await getJson(url);
  } catch (err) {
    return Promise.reject(err);
  }
};

/*******************/
/* Event Listeners */
/*******************/

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  onSearchSubmitHandler();

  //   searchInput.value = "";
});

searchForm.addEventListener("click", (e) => {
  if (e.target.id === "save-button") {
    onSaveImageHandler(e);
  }
});

emailForm.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("submit");

  addEmail();
});

emailSelect.addEventListener("change", (e) => {
  onSelectChangeHandler(e);
});

window.addEventListener("DOMContentLoaded", () => {
  onPageLoadHandler();
});

savedImageContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-button")) {
    removeSavedImage(e);
  }
});

const addAttribution = (imageData) => {
  console.log("attribution");
  const {
    id,
    user: { name },
    user: { username },
  } = imageData;

  attribution.innerHTML = `<span title="View ${name}'s account on Unsplash">Photo by <a href="https://unsplash.com/@${username}" target="_blank">${name}</a></span>
  <span title="View ${name}'s photo on Unsplash">View photo on <a href="https://unsplash.com/photos/${id}" target="_blank">Unsplash</span>`;
};

const showMainImageError = (msg) => {
  const parent = mainImageContainer;
  const error = createDivWrapper(msg, ["error"]);
  addImageToDom(error, parent);
  updateAttributionOnError();
};

const updateAttributionOnError = () => {
  attribution.innerHTML = `<span><strong>No Images Found</strong></span>`;
};

getAccountImageCount = (account) => {
  return account.images.length;
};

const checkImageErrorExists = () => {
  return mainImageContainer.querySelector(".main-image-container > .error") ? true : false;
};

window.addEventListener("load", (e) => {
  console.log(e.target);
});
