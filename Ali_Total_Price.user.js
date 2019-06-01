// ==UserScript==
// @author       AndShy
// @name         Ali Total Price
// @description  Show Total Price on Aliexpress for both new and old site versions
// @version      1.3
// @namespace    https://github.com/AndShy
// @homepageURL  https://github.com/AndShy/Ali-Total-Price
// @downloadURL  https://github.com/AndShy/Ali-Total-Price/raw/master/Ali_Total_Price.user.js
// @match        *://*.aliexpress.com/item/*
// @match        *://*.aliexpress.com/store/product*
// @compatible   chrome
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var productShippingPrice, productInfo, topPanel, skuList, quantInp, totPrice;
    var observer = new MutationObserver(changePrice);
    var config1 = { attributes: true, attributeFilter: ['value'], childList: false, subtree: false};
    var config2 = { attributes: true, childList: false, subtree: true, characterData: true};

    document.addEventListener('readystatechange', event => {
		if (event.target.readyState === 'complete') {
    		completeLoading();
  		}
	});

    function completeLoading() {
      // ------------------------------
      // Thanks "hamicuia" for old site version script
      // https://greasyfork.org/ru/scripts/382601-aliexpress-total-price-script
      var totalPriceClass = document.querySelectorAll(".p-property-item.p-total-price.hide-total-price");
      if (totalPriceClass.length > 0) {
        for(var i = 0, max = totalPriceClass.length; i < max; i++) {
          totalPriceClass[i].className="p-property-item p-total-price";
        }
      }
      // ------------------------------
      else {
        skuList = document.querySelector('div.product-sku');
        topPanel = document.getElementById('top-lighthouse');
        quantInp = document.querySelector('span.next-input.next-medium.next-input-group-auto-width >:first-child');
        productInfo = document.querySelector('div.product-info');
        productShippingPrice = document.querySelector('div.product-shipping');

        if (productInfo){
          totPrice = document.createElement('div');
          totPrice.innerHTML =
          "<span class='bold' style='font-size:24px'>Total Price : </span>" + "<span class='bold' id='ttlprc' style='font-size:24px; color:red'>---</span>";
          productInfo.insertBefore(totPrice, productInfo.querySelector('div.product-action'));
          getPrice();
          changePrice();
          if (quantInp) observer.observe(quantInp, config1);
          if (skuList) observer.observe(skuList, config2);
          if (productShippingPrice) observer.observe(productShippingPrice, config2);
        }
      }
    }



    function getPrice() {
    	    var priceEl = document.querySelector('span.product-price-value');
          var tmp;
    	if (priceEl){
        if (priceEl.textContent.match(/^.*?\-.*?$/m)) {
    			return;
    		}
    		else {
          tmp = priceEl.textContent.replace(/\s/g, '');
          tmp = tmp.replace(/\s/g, '');
          return tmp.replace(/^.*?(\d+)(\.|,)?(\d*).*?$/, '$1.$3');
    		}
    	}
    return;
    }

    function getCurrency() {
      if (document.querySelector("span.currency").textContent) {
        return document.querySelector("span.currency").textContent;
      }
      else {
        return 'USD';
      }
    }

    function getShipping() {
      var shippingCost = document.querySelector('span.product-shipping-price');
      var tmp;
      if (shippingCost != null){
        if (shippingCost.textContent.match(/^.*?\d+(\.|,)?\d*.*?$/)) {
          tmp = shippingCost.textContent.replace(/\s/g,'');
          return tmp.replace(/^.*?(\d+)(\.|,)?(\d*).*?$/,'$1.$3');
        }
        else {
          return '0';
        }
      }
      else {
        return '0';
      }
    }

    function changePrice() {
  		var ttl = document.getElementById('ttlprc');
  		var price = getPrice();
  		if (price) {
  			ttl.textContent = new Intl.NumberFormat('us-US', { style: 'currency', currency: (getCurrency()) }).format(+quantInp.value * +price + +getShipping());
  		}
  		else {
  			ttl.textContent = '---';
  		}
	}

})();
