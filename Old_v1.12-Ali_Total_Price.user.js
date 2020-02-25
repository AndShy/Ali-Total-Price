// ==UserScript==
// @author       AndShy
// @name         Ali Total Price
// @description  Show Total Price on Aliexpress for both new and old site versions
// @version      1.12
// @license      GPL-3.0
// @namespace    https://github.com/AndShy
// @homepageURL  https://github.com/AndShy/Ali-Total-Price
// @downloadURL  https://github.com/AndShy/Ali-Total-Price/raw/master/Ali_Total_Price.user.js
// @match        *://*.aliexpress.com/item/*
// @match        *://*.aliexpress.com/store/product*
// @match        *://aliexpress.ru/item/*
// @match        *://aliexpress.ru/store/product*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var productShippingPrice, productInfo, topPanel, skuList, quantInp, totPrice, lot_quant_el, lot_html;
    var observer = new MutationObserver(changePrice);
    var config1 = { attributes: true, attributeFilter: ['value'], childList: false, subtree: false};
    var config2 = { attributes: true, childList: false, subtree: true, characterData: true};

    document.addEventListener('readystatechange', event => {
    if (event.target.readyState === 'complete') {
        setTimeout(completeLoading, 1000);
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
        lot_quant_el = document.querySelector('span.product-price-piece');

        if (productInfo){
          totPrice = document.createElement('div');
          totPrice.innerHTML =
          "<span class='bold' title='1 pcs/lot price = (base price * quantity + shipping cost)/quantity' style='font-size:14px; background-color:#f0f0f0'>One piece price:&nbsp;&nbsp;</span>" +
          "<span class='bold' title='1 pcs/lot price = (base price * quantity + shipping cost)/quantity' id='pcs_prc' style='font-size:14px; color:blue; background-color:#f0f0f0'>---</span><br>" +
          "<span class='bold' style='font-size:24px'>Total Price:&nbsp;&nbsp;</span>" +
          "<span class='bold' id='ttlprc' style='font-size:24px; color:red'>---</span>";
          productInfo.insertBefore(totPrice, productInfo.querySelector('div.product-action'));
          if (lot_quant_el) {
            var lot_html =  
            "<span class='bold' title='price for 1pcs from lot' style='font-size:14px; color:black'>&nbsp;&nbsp;&nbsp;1pcs:&nbsp;</span>" +
            "<span class='bold' id='lotpcsprc' title='price for 1pcs from lot' style='font-size:14px; color:green'>---</span>";
            lot_quant_el.insertAdjacentHTML('beforeend', lot_html);
          }
          changePrice();
          if (quantInp) observer.observe(quantInp, config1);
          if (skuList) observer.observe(skuList, config2);
          if (productShippingPrice) observer.observe(productShippingPrice, config2);
        }
      }
    }



    function getPrice() {
          var priceEl = document.querySelector('span.product-price-value');
          var cur_re = /\D*(\d+|\d.*?\d)(?:\D+(\d{2}))?\D*$/;
          var tmp;
      if (priceEl){
        if (priceEl.textContent.match(/^.*?\-.*?$/m)) {
          return;
        }
        else {
          tmp = cur_re.exec(priceEl.textContent);
          return (tmp[1].replace(/\D/g,'')+'.'+(tmp[2]?tmp[2]:'00'));
        }
      }
    return;
    }

    function getCurrency() {
      var curr_tmp = document.querySelector('span.currency');
      if (curr_tmp != null) {
        if (curr_tmp.textContent != null) {
          return curr_tmp.textContent;
        }
        else {
          return 'USD';
        }
      }
      else {
        return 'USD';
      }
    }

    function getShipping() {
      var shippingCost = document.querySelector('div.product-shipping-price > span.bold');
      var cur_re = /\D*(\d+|\d.*?\d)(?:\D+(\d{2}))?\D*$/;
      var tmp;
      if (shippingCost != null){
        if (shippingCost.textContent.match(/^\D*\d.*?\d\D*$/)) {
          tmp = cur_re.exec(shippingCost.textContent);
          return (tmp[1].replace(/\D/g,'')+'.'+(tmp[2]?tmp[2]:'00'))
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
      var pcs_prc = document.getElementById('pcs_prc');
      var lotpcsprc = document.getElementById('lotpcsprc');
      var price = getPrice();
      var curr = getCurrency();
      if (price) {
        var tp = +quantInp.value * +price + +getShipping();
        ttl.textContent = new Intl.NumberFormat('us-US', {style: 'currency', currency: (curr)}).format(tp);
        pcs_prc.textContent ='~' + new Intl.NumberFormat('us-US', {style: 'currency', currency: (curr)}).format(tp/+quantInp.value);
        if (lot_quant_el){
          var lot_quant = lot_quant_el.textContent.match(/\d+/);
          lotpcsprc.textContent = new Intl.NumberFormat('us-US', {style: 'currency', currency: (curr), maximumFractionDigits: 5}).format(+price/+lot_quant[0]);
        }
      }
      else {
        ttl.textContent = '---';
        pcs_prc.textContent = '---';
        if (lot_quant_el){
          lotpcsprc.textContent = '---';
        }
      }
  }

})();
