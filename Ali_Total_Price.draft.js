// ==UserScript==
// @author       AndShy
// @name         Ali Total Price
// @description  Show Total Price on Aliexpress for both new and old site versions
// @version      1.9
// @license      GPL-3.0
// @namespace    https://github.com/AndShy
// @homepageURL  https://github.com/AndShy/Ali-Total-Price
// @downloadURL  https://github.com/AndShy/Ali-Total-Price/raw/master/Ali_Total_Price.draft.js
// @match        *://*.aliexpress.com/item/*
// @match        *://*.aliexpress.com/store/product*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var productShippingPrice, productInfo, topPanel, skuList, quantInp, totPrice;
    var observer = new MutationObserver(changePrice);
    var config1 = { attributes: true, attributeFilter: ['value'], childList: false, subtree: false};
    var config2 = { attributes: true, childList: false, subtree: true, characterData: true};

    //rewrite that block to ESversion 5
    document.addEventListener('readystatechange', event => {
		if (event.target.readyState === 'complete') {
    		setTimeout(completeLoading, 1500);
  		}
	});

    /*function debugging(state) {
    	//alert('DEBUG ' + state);
    	console.log('debug :' + state);
    	console.log(document.getElementById('top-lighthouse'));
    }*/

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
          //parelm = shippingEl.parentNode;
          //shippingEl.parrentNode.appendChild(totPrice);
          productInfo.insertBefore(totPrice, productInfo.querySelector('div.product-action'));

          //document.querySelector('span.next-input.next-medium.next-input-group-auto-width >:first-child').addEventListener('input', changePrice, false);
          //document.querySelector('span.next-input-group').addEventListener('mouseup', changePrice, false);
          //quantInp.dispatchEvent(new Event('tstev'));
          //quantInp.addEventListener('tstev', changePrice, false);
          //console.log(document.querySelector('span.next-input.next-medium.next-input-group-auto-width >:first-child'));
          //document.querySelector('span.next-input-group').addEventListener('change', changePrice, true);

          //document.addEventListener('afterscriptexecute', evDebug);
          //document.documentElement.addEventListener('load', evDebug, true);
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
          //console.log(tmp[1].replace(/\D/g,'')+'.'+(tmp[2]?tmp[2]:'00'))
          return (tmp[1].replace(/\D/g,'')+'.'+(tmp[2]?tmp[2]:'00'));
        }
    		/*if (priceEl.textContent.match(/^.{1,3} .?\d+(\.|\,)?\d*? \- \d+(\.|\,)?\d*?$/m)) {
    			//console.log(priceEl.textContent.match(/^.{1,3} .?\d+(\.|\,)?\d*? \- \d+(\.|\,)?\d*?$/m));
    			return;
    		}
    		else {
    			if (priceEl.textContent.match(/^.{1,3} .?(\d+\.?\d{0,5})$/m)) {
    				//console.log(priceEl.textContent.match(/^.{1,3} .?(\d+\.?\d{0,5})$/m)[1]);
    			return priceEl.textContent.match(/^.{1,3} .?(\d+\.?\d{0,5})$/m)[1];
    			}
    			else {
    				var tmp = priceEl.textContent.match(/^.{1,3} .?(\d+\,?\d{0,5})$/m)[1];
    				if (tmp.match(/^\d+\,\d{0,5}$/))	{
    						//console.log('----!!!!!----')
    						return tmp.replace(/^(\d+)\,(\d{0,5})$/,'$1.$2');
    					}
    				else {
    						return tmp;
    					}
    			}

    		}*/

    	}
    return;
    }

    function getCurrency() {
      var curr_tmp = document.querySelector('span.currency');
      //console.log(document.querySelector("span.currency"));
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
  		//document.getElementById('ttlprc').innerText = document.getElementById('ttlprc').innerText + 1;
  		//document.querySelector('span.next-input.next-medium.next-input-group-auto-width')
  		//console.log(event.type, document.querySelector('span.next-input.next-medium.next-input-group-auto-width >:first-child').value);
  		//alert('Horray! Someone wrote "' + this.value + '"!');
  		//debugger;
  		/*for (var mutation of mutationList){
  			console.log(mutation.type, mutation.attributeName, mutation.oldValue, observer);
  		}*/

  		var ttl = document.getElementById('ttlprc');
  		var price = getPrice();
  		if (price) {
  			ttl.textContent = new Intl.NumberFormat('us-US', { style: 'currency', currency: (getCurrency()) }).format(+quantInp.value * +price + +getShipping());
  			//console.log(ttl.textContent);
  		}
  		else {
  			ttl.textContent = '---';
  		}

   		//console.log(ttl.textContent, ttl.innerHTML);
	}



})();
