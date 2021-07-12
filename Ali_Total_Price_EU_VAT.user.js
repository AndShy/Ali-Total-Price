// ==UserScript==
// @author       AndShy
// @name         Ali Total Price EU VAT
// @description  Shows Total Price on Aliexpress
// @version      2.7b
// @license      GPL-3.0
// @namespace    https://github.com/AndShy
// @match        *://*.aliexpress.com/*
// @match        *://aliexpress.ru/*
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM.listValues
// @grant       GM.deleteValue
// ==/UserScript==

(function() {
    'use strict';
    var pathRegExp1 = /\/item\//i
    var pathRegExp2 = /\/product\//i
    var pathRegExp3 = /\/w\//i;
    var pathRegExp4 = /\/af\//i;
    var pathRegExp5 = /\/wholesale/i;
    var pN = window.location.pathname;
    var currency;


    switch(true){
        case pathRegExp1.test(pN):
        case pathRegExp2.test(pN):
            itemPageObserver();
            break;

        case pathRegExp3.test(pN):
        case pathRegExp4.test(pN):
        case pathRegExp5.test(pN):
            searchPageObserver();
            break;

        default:
            return;
    }

    function searchPageObserver() {
        const searchObserverConf = {childList: true, subtree: true};
        var searchObserver = new MutationObserver(LazyLoadOnSearch);
        var timer1 = setInterval(function() {
            currency = document.querySelector('a#switcher-info > span.currency');
            if (currency) {
                if (currency.innerText.length == 3) {
                    currency = currency.innerText;
                    clearInterval(timer1);
                    var listItems = document.querySelector('ul.list-items');
                    if (listItems) {searchObserver.observe (listItems,searchObserverConf)};
                    LazyLoadOnSearch();
                }
            }
        },100)
    }

    function itemPageObserver() {
        const itemObserverConf1 = {attributes: true, attributeFilter: ['value'], childList: false, subtree: false};
        const itemObserverConf2 = {attributes: true, childList: false, subtree: true, characterData: true};
        var skuListEl = document.querySelector('div.product-sku');
        var quantInpEl = document.querySelector('span.next-input.next-medium.next-input-group-auto-width > input');
        var shippingEl = document.querySelector('div.product-shipping');
        var itemObserver = new MutationObserver(refreshItemValues);
        var timer1 = setInterval(function() {
            currency = document.querySelector('a#switcher-info > span.currency');
            if (currency) {
                if (currency.innerText.length == 3) {
                    currency = currency.innerText;
                    clearInterval(timer1);
                    itemInsertHTML();
                    if (quantInpEl) itemObserver.observe(quantInpEl, itemObserverConf1);
                    if (skuListEl) itemObserver.observe(skuListEl, itemObserverConf2);
                    if (shippingEl) itemObserver.observe(shippingEl, itemObserverConf2);
                    refreshItemValues();
                }
            }

        },100)

    }

    async function itemInsertHTML() {
        var lotEl = document.querySelector('div.product-price-current.lot');
        var productInfo = document.querySelector('div.product-info');
        if (productInfo){
            var totPrice = document.createElement('div');
            totPrice.innerHTML =
            "<div class='bold' title='1 pcs/lot price = (base price * quantity + shipping cost)/quantity' style='font-size:14px; background-color:#f0f0f0'>" +
            "<span>One piece/lot price:&nbsp;&nbsp;</span><span id='pcs_prc' style='color:blue;'>---</span></div>" +
            "<div class='bold' style='font-size:24px'><span>Total Price:&nbsp;&nbsp;</span><span id='ttl_prc' style='color:red'>---</span></div>" +
            "<form id='vatF'>" +
            "<p><span>VAT:</span> <input type='text' maxlength='2' placeholder='%' name='vat' size='3'><span>&nbsp;&nbsp; VAT threshold:&nbsp;</span><input type='text' maxlength='3' name='threshold' size='3'></p>" +
            //"<input type='submit' style='position: absolute; left: -9999px; width: 1px; height: 1px;'/>" +
            "<input type='submit' hidden />" +
            "</form>" +
            "<p><span style='font-size:24px; color:black; font-weight:bold'>Price with VAT:&nbsp;&nbsp;</span><span id='vatprc' style='font-size:24px; color:red; font-weight:bold'>Same as total price</span></p>";
            productInfo.insertBefore(totPrice, productInfo.querySelector('div.product-action'));
            var vatForm = document.getElementById('vatF');
            
            const storage_vat = await GM.getValue('vat', 20);
            const storage_thresh = await GM.getValue('threshold', 22);
            vatForm.vat.value = storage_vat;
            vatForm.threshold.value = storage_thresh;

            if (vatForm){
                vatForm.addEventListener('submit', (e)=>{e.preventDefault(); e.target.vat.blur();e.target.threshold.blur();});
                vatForm.addEventListener('blur', changeInput, true);
                vatForm.addEventListener('keypress', (e)=>{if (e.which!=13 && (e.which < 48 || e.which > 57)){e.preventDefault();}});
            }

            if (lotEl) {
                var lot_html =  
                "<span class='bold' title='price for 1pcs from lot' style='font-size:14px; color:black'>&nbsp;&nbsp;&nbsp;1pcs:&nbsp;" +
                "<span id='lot_pcs_prc' style='color:green;'>---</span></span>";
                lotEl.insertAdjacentHTML('beforeend', lot_html);
            }
        }
    }

    function refreshItemValues() {
        var myPcsPrcEl = document.getElementById('pcs_prc');
        var myTtlPrcEl = document.getElementById('ttl_prc');
        var myLotPcsPrcEl = document.getElementById('lot_pcs_prc');
        var lotEl = document.querySelector('span.product-price-piece');
        var shCostEl = document.querySelector('div.product-shipping-price > span.bold');
        var quantInpEl = document.querySelector('span.next-input.next-medium.next-input-group-auto-width > input');
        var itemPriceEl = document.querySelector('span.product-price-value');
        var vatForm = document.getElementById('vatF');
        var priceWithVAT = document.getElementById('vatprc');
        
		if (!itemPriceEl) {
            itemPriceEl = document.querySelector('div > span.oyuLA');
            if (!itemPriceEl) {itemPriceEl = document.querySelector('span.uniform-banner-box-price')}
        }
		
        if (itemPriceEl && shCostEl && quantInpEl) {
            if (!itemPriceEl.innerText.includes(' - ')) {
                var itemPriceValue, shCostValue, temp_ttlprc;
                itemPriceValue = strToCurrency(itemPriceEl.innerText);
                shCostValue = strToCurrency(shCostEl.innerText);
                temp_ttlprc = (+itemPriceValue * +quantInpEl.value) + +shCostValue;
                myTtlPrcEl.innerText = calcTotalPrice(temp_ttlprc, 2);
                myPcsPrcEl.innerText = calcTotalPrice(temp_ttlprc/+quantInpEl.value, 2);

                var timer2 = setInterval(function(){
                    if (!!vatForm.vat.value && !!vatForm.threshold.value) {
                        var vatValue = vatForm.vat.value;
                        var vatThreshold = vatForm.threshold.value;
                        clearInterval(timer2); 
                        if (temp_ttlprc > vatThreshold) { 
                            priceWithVAT.innerText = calcTotalPrice(temp_ttlprc + ((temp_ttlprc/100) * +vatValue));
                        }
                        else {
                            priceWithVAT.innerText = 'Same as total price';
                        }
                    }
                }, 100);

                if (myLotPcsPrcEl) {
                    myLotPcsPrcEl.innerText = calcTotalPrice(+itemPriceValue/+lotEl.innerText.match(/\d+/), 5);
                }
            }
            else {
                myPcsPrcEl.innerText = '---';
                myTtlPrcEl.innerText = '---';
                priceWithVAT.innerText = '---';
                if (myLotPcsPrcEl) myLotPcsPrcEl.innerText = '---';
            }
        }
    }

    function priceFromEl (el) {
        if (el) {
            if (el.innerText) {
                strToCurrency(el.innerText);
            }
        }
    }

    function LazyLoadOnSearch() {
        var prodList = document.querySelectorAll('div.product-info > div.hover-help > div.item-shipping-wrap');
        var prodGallery = document.querySelectorAll('div.right-zone > div.item-shipping-wrap');
        for (var i = 0, max_i = prodList.length; i < max_i; i++) {
            if (prodList[i].dataset.edited != 'True') {
                var packagingEl;
                var ttlPriceList = document.createElement('div');
                ttlPriceList.style = 'padding-bottom: 5px';
                prodList[i].parentNode.insertBefore(ttlPriceList, prodList[i].nextElementSibling);
                ttlPriceList.innerHTML =
                "<span class='item-shipping-wrap' style='font-size:12px; font-weight:bold'>Total Price:&nbsp;&nbsp;</span>" +
                "<span class='item-shipping-wrap' style='font-size:12px; color:red; font-weight:bold'>" + SearchPageTotalPrice(ttlPriceList) + "</span>";
                packagingEl = ttlPriceList.parentNode.querySelector('div.item-price-wrap > div.item-price-row.packaging-sale');
                if (packagingEl) {
                    packagingEl.style = 'display: block';
                    packagingEl.parentNode.parentNode.parentNode.parentNode.parentNode.classList.remove('packaging_sale');
                }
                prodList[i].dataset.edited = 'True';
            }
        }
        for (var j = 0, max_j = prodGallery.length; j < max_j; j++) {
            if (prodGallery[j].dataset.edited != 'True') {
                var ttlPriceGallery = document.createElement('div');
                ttlPriceGallery.style = 'padding-bottom: 5px';
                prodGallery[j].parentNode.insertBefore(ttlPriceGallery, prodGallery[j].nextElementSibling);
                ttlPriceGallery.innerHTML =
                "<span class='item-shipping-wrap' style='font-size:12px; font-weight:bold'>Total Price:&nbsp;&nbsp;</span>" +
                "<span class='item-shipping-wrap' style='font-size:12px; color:red; font-weight:bold'>" + SearchPageTotalPrice(ttlPriceGallery) + "</span>";

                prodGallery[j].dataset.edited = 'True';
            }
        }
    }

    function SearchPageTotalPrice (myEl) {
        if (myEl.parentNode.querySelector('span.price-current') && myEl.parentNode.querySelector('span.shipping-value')){
            var itemPriceEl = myEl.parentNode.querySelector('div.item-price-wrap > div > span.price-current');
            var shCostEl = myEl.parentNode.querySelector('div.item-shipping-wrap > span.shipping-value');
            var itemPriceValue = [], shCostValue;
            shCostValue = strToCurrency(shCostEl.innerText);
            if (itemPriceEl.innerText.includes(' - ')) {
                itemPriceValue = itemPriceEl.innerText.split(' - ');
                itemPriceValue[0] = strToCurrency(itemPriceValue[0]);
                itemPriceValue[1] = strToCurrency(itemPriceValue[1]);
                return (calcTotalPrice(+itemPriceValue[0] + +shCostValue, 2) + ' - ' + calcTotalPrice(+itemPriceValue[1] + +shCostValue, 2));
            }
            else {
                itemPriceValue[0] = strToCurrency(itemPriceEl.innerText);
                return (calcTotalPrice(+itemPriceValue[0] + +shCostValue, 2));
            }
        }
    }

    function strToCurrency (str) {
        var currencyRegExp = /\D*(\d+|\d.*?\d)(?:\D+(\d{2}))?\D*$/;
        var tmp = [];
        if (!str.match(/\d/)) return 0;
        tmp = currencyRegExp.exec(str);
        tmp[1] = tmp[1].replace(/\D+/g,'');
        return (tmp[1] + '.' + (tmp[2]?tmp[2]:'00'));
    }

    function calcTotalPrice(value, decDigits) {
        return new Intl.NumberFormat('us-US', {style: 'currency', currency: currency, maximumFractionDigits: decDigits}).format(value);
    }

    function changeInput(e) {
        e.target.value = Number(e.target.value);
        setvalue(e.target.name, e.target.value);
        refreshItemValues();
    }


    function setvalue(n, v) {
        (async()=>{await GM.setValue(n, v);})();
    }

})();