// Firebase Yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyA16M_6xOrUGEn9YCdzIFxBYXr-9ST7IWY",
    authDomain: "qrmenuapplication-9b920.firebaseapp.com",
    databaseURL: "https://qrmenuapplication-9b920-default-rtdb.firebaseio.com",
    projectId: "qrmenuapplication-9b920",
    storageBucket: "qrmenuapplication-9b920.appspot.com",
    messagingSenderId: "1050979828232",
    appId: "1:1050979828232:web:54d81e21056193bee147bd",
    measurementId: "G-C3S611TREX"
};

// Firebase'i Başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let selectedLanguage = 'tr'; // Varsayılan dil

function setLanguage(lang) {
    selectedLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    fetchMenuItems();
}

// Sayfa yüklendiğinde seçili dili kontrol et
document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem('selectedLanguage');
    if (lang) {
        selectedLanguage = lang;
    }
    setLanguage(selectedLanguage);

    // Sayfa yüklendiğinde modalin gizli olduğundan emin olun
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';

    // QR Menü butonuna tıklama olayı ekle
    const qrMenuLabel = document.getElementById('qrMenuLabel');
    qrMenuLabel.addEventListener('click', () => {
        hideHeaderAndShowCategories();
    });
});

let categoriesData = {}; // Kategorileri depola
let productsData = {}; // Ürünleri depola

// Header'ı gizle ve kategorileri göster
function hideHeaderAndShowCategories() {
    const header = document.getElementById('header');
    header.classList.add('hidden');

    // Küçük header'ı gizle (ilk defa kategoriler yüklendiğinde görünmemesi için)
    // smallHeader artık kullanılmıyor

    fetchMenuItems();
}

// Firebase'den menü öğelerini çek
async function fetchMenuItems() {
    const menuContent = document.getElementById('menuContent');
    menuContent.innerHTML = ''; // Mevcut içeriği temizle
    categoriesData = {}; // Kategorileri sıfırla
    productsData = {}; // Ürünleri sıfırla

    // Google Yorum butonunu göster
    document.getElementById('googleReviewButton').style.display = 'block';

    // Body'den sınıfı kaldır
    document.body.classList.remove('header-hidden');

    try {
        // Kategorileri ve ürünleri paralel olarak çek
        const [catSnapshot, productSnapshot] = await Promise.all([
            database.ref('Categories2').orderByChild('order').once('value'),
            database.ref('Products2').once('value')
        ]);

        const categoryData = catSnapshot.val() || {};
        const productsDataRaw = productSnapshot.val() || {};

        // Kategorileri işle
        for (let categoryId in categoryData) {
            const categoryInfo = categoryData[categoryId];
            if (categoryInfo) {
                categoriesData[categoryId] = {
                    ...categoryInfo,
                    id: categoryId
                };
            }
        }

        // Ürünleri işle
        for (let productId in productsDataRaw) {
            const product = productsDataRaw[productId];
            if (product && product.categoryId) {
                const categoryId = product.categoryId;
                if (!productsData[categoryId]) {
                    productsData[categoryId] = [];
                }
                productsData[categoryId].push({
                    ...product,
                    id: productId
                });
            }
        }

        // Kategorileri 'order' değerine göre sırala
        const sortedCategories = Object.values(categoriesData).sort((a, b) => {
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            return orderA - orderB;
        });

        // Kategorileri görüntüle
        sortedCategories.forEach((categoryInfo, index) => {
            const categoryName = categoryInfo['name_' + selectedLanguage] || categoryInfo['name_tr'] || 'Kategori İsmi';
            const categoryImageUrl = categoryInfo.imageUrl || '';

            // Kategori öğesi oluştur
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category-container');
            categoryDiv.style.animationDelay = `${index * 0.1}s`; // Animasyon gecikmesi

            const categoryTitleDiv = document.createElement('div');
            categoryTitleDiv.classList.add('category');

            // Arkaplan resmi ayarla
            categoryTitleDiv.style.backgroundImage = `url(${categoryImageUrl})`;

            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = categoryName;

            // Kategoriye tıklama olayı ekle
            categoryTitleDiv.addEventListener('click', () => {
                showCategoryProducts(categoryInfo);
            });

            categoryTitleDiv.appendChild(categoryTitle);

            categoryDiv.appendChild(categoryTitleDiv);
            menuContent.appendChild(categoryDiv);
        });

    } catch (error) {
        console.error('Veri çekilirken hata oluştu:', error);
    }
}

// Seçili kategorinin ürünlerini göster
function showCategoryProducts(categoryInfo) {
    const menuContent = document.getElementById('menuContent');
    menuContent.innerHTML = ''; // Mevcut içeriği temizle

    // Header'ı ayarla
    const header = document.getElementById('header');
    header.classList.add('category-header');
    header.style.backgroundImage = `url(${categoryInfo.imageUrl || 'default-category.jpg'})`;

    // Header içeriklerini gizle
    const headerContent = document.getElementById('headerContent');
    headerContent.classList.add('hidden');

    const qrMenuLabel = document.getElementById('qrMenuLabel');
    qrMenuLabel.classList.add('hidden');

    const socialIcons = document.getElementById('socialIcons');
    socialIcons.classList.add('hidden');

    const scrollDown = document.getElementById('scrollDown');
    scrollDown.classList.add('hidden');

    // Google Yorum butonunu gizle
    document.getElementById('googleReviewButton').style.display = 'none';

    // CSS ayarlamaları için body'ye sınıf ekle
    document.body.classList.add('header-hidden');

    // Header Overlay'i göster
    let overlayDiv = document.querySelector('.header-overlay');
    if (!overlayDiv) {
        overlayDiv = document.createElement('div');
        overlayDiv.classList.add('header-overlay');
        header.appendChild(overlayDiv);
    }
    overlayDiv.classList.add('visible');

    // Kategori başlığı ve geri butonu
    overlayDiv.innerHTML = ''; // Önceki içerikleri temizle

    // Geri butonu ekle
    const backButton = document.createElement('button');
    backButton.classList.add('back-button');
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';

    backButton.addEventListener('click', () => {
        // Modalı gizle
        const modal = document.getElementById('imageModal');
        modal.style.display = 'none';

        // Header ve diğer öğeleri geri getir
        header.classList.remove('category-header');
        header.style.backgroundImage = `url('şato.png')`;

        header.classList.add('hidden');

        // Header içeriklerini geri getir
        headerContent.classList.remove('hidden');
        qrMenuLabel.classList.remove('hidden');
        socialIcons.classList.remove('hidden');
        scrollDown.classList.remove('hidden');

        document.getElementById('googleReviewButton').style.display = 'block';

        // Body'den sınıfı kaldır
        document.body.classList.remove('header-hidden');

        // Header-overlay'i gizle
        overlayDiv.classList.remove('visible');

        // menu-container'dan 'products-view' sınıfını kaldırın
        menuContent.classList.remove('products-view');

        // Kategori listesine geri dön
        fetchMenuItems();
    });

    overlayDiv.appendChild(backButton);

    // Kategori ismi
    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = categoryInfo['name_' + selectedLanguage] || categoryInfo['name_tr'] || 'Kategori İsmi';
    overlayDiv.appendChild(categoryTitle);

    // menu-container'a 'products-view' sınıfını ekleyin
    menuContent.classList.add('products-view');

    // Bu kategori için ürünleri al
    const categoryId = categoryInfo.id;
    const products = productsData[categoryId] || [];

    // Header'ı göster
    header.classList.remove('hidden');

    // Ürünleri görüntüle
    products.forEach((product, index) => {
        const productDetailsDiv = document.createElement('div');
        productDetailsDiv.classList.add('product-details');
        productDetailsDiv.style.animationDelay = `${index * 0.1}s`; // Animasyon gecikmesi

        const productName = product['name_' + selectedLanguage] || product['name_tr'] || 'Ürün İsmi';
        const productDescription = product['description_' + selectedLanguage] || product['description_tr'] || '';
        const productPrice = product.price ? `₺${product.price}` : '';

        const productInfoDiv = document.createElement('div');
        productInfoDiv.classList.add('product-info');

        const titleDiv = document.createElement('div');
        titleDiv.classList.add('product-title');
        titleDiv.textContent = productName;

        const priceSpan = document.createElement('div');
        priceSpan.classList.add('product-price');
        priceSpan.textContent = productPrice;

        const descriptionP = document.createElement('p');
        descriptionP.classList.add('product-description');
        descriptionP.textContent = productDescription;

        productInfoDiv.appendChild(titleDiv);
        productInfoDiv.appendChild(priceSpan);
        productInfoDiv.appendChild(descriptionP);

        // Sadece product.imageUrl varsa img öğesi oluştur
        if (product.imageUrl) {
            const img = document.createElement('img');
            img.src = product.imageUrl;
            img.alt = productName;
            img.classList.add('product-image');

            // Resim yüklendiğinde bulanıklığı kaldır
            img.onload = () => {
                img.style.filter = 'blur(0)';
            };

            // Yüklenirken bulanıklık efekti
            img.style.filter = 'blur(10px)';

            // Resme tıklama olayı ekle
            img.addEventListener('click', () => {
                openImageModal(product.imageUrl, productName);
            });

            productDetailsDiv.appendChild(img);
        }

        productDetailsDiv.appendChild(productInfoDiv);

        menuContent.appendChild(productDetailsDiv);
    });
}

// Ürün resim modali aç
function openImageModal(imageUrl, altText) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = "block";
    modalImg.src = imageUrl;
    modalImg.alt = altText;
}

// Modali kapat
const modal = document.getElementById('imageModal');
const modalClose = document.getElementById('modalClose');

modalClose.onclick = function() {
    modal.style.display = "none";
};

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};
