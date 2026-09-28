import{l as A}from"./index-DmYSSdHE.js";function g(e){return e?e.replace(/\r\n/g," ").replace(/[\r\n\t]/g," ").trim():""}function k(e,o){const n=[];e.description&&e.description.trim()&&n.push(e.description.trim()),o&&n.push(`Categoría: ${o}.`),e.isMadeToOrder?n.push(`Fabricación a pedido (plazo estimado ${e.leadTimeDays||15} días hábiles).`):n.push("Disponible para entrega inmediata.");const s=Array.isArray(e.specifications)?e.specifications.filter(r=>r&&r.key&&r.value):[];if(s.length>0){const r=s.map(c=>`${c.key}: ${c.value}`).join(" | ");n.push(`Especificaciones técnicas: ${r}.`)}return n.join(" ")}function $(e,o,n,s={}){const{priceType:r="retail",selectedCategories:c=[],onlyActive:l=!0,currency:a=n.currency||"ARS",brand:d=n.name||"Titufaris"}=s,u=new Map;o.forEach(t=>u.set(t.id,t.name));const f=e.filter(t=>!(l&&t.active===!1||c.length>0&&!c.includes(t.category))).map(t=>{const i=u.get(t.category)||t.category,m=k(t,i),h=r==="wholesale"?t.wholesalePrice:t.retailPrice,p=t.stock>0||t.isMadeToOrder?"in_stock":"out_of_stock",b=A(t),y=t.sku||t.id,_=t.imageUrl||"https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80";return`    <item>
      <g:id><![CDATA[${y}]]></g:id>
      <g:title><![CDATA[${g(t.name).slice(0,150)}]]></g:title>
      <g:description><![CDATA[${g(m).slice(0,5e3)}]]></g:description>
      <g:link><![CDATA[${b}]]></g:link>
      <g:image_link><![CDATA[${_}]]></g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${p}</g:availability>
      <g:price>${h.toFixed(2)} ${a}</g:price>
      <g:brand><![CDATA[${d}]]></g:brand>
      <g:google_product_category><![CDATA[Business & Industrial > Retail]]></g:google_product_category>
      <g:product_type><![CDATA[${i}]]></g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:mpn><![CDATA[${t.sku||t.id}]]></g:mpn>
      <g:custom_label_0><![CDATA[${i}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${t.isMadeToOrder?"Fabricación a pedido":"Entrega inmediata"}]]></g:custom_label_1>
    </item>`}).join(`
`);return`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title><![CDATA[Catálogo de Productos Titufaris - Google Merchant Center]]></title>
    <link><![CDATA[${n.website||"https://titufaris.com.ar"}]]></link>
    <description><![CDATA[Feed oficial de Google Shopping y fichas de producto de equipamiento comercial Titufaris]]></description>
${f}
  </channel>
</rss>`}function D(e,o,n,s={}){const r=$(e,o,n,s),c=new Blob([r],{type:"application/rss+xml;charset=utf-8;"}),l=URL.createObjectURL(c),a=document.createElement("a"),d=new Date().toISOString().slice(0,10);a.href=l,a.download=`Google_Merchant_Feed_${n.name||"Titufaris"}_${d}.xml`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(l)}function w(e,o,n,s={}){const{priceType:r="retail",selectedCategories:c=[],onlyActive:l=!0,currency:a=n.currency||"ARS",brand:d=n.name||"Titufaris"}=s,u=new Map;o.forEach(i=>u.set(i.id,i.name));const T=e.filter(i=>!(l&&i.active===!1||c.length>0&&!c.includes(i.category))),f=["id","title","description","link","image_link","availability","price","google_product_category","brand","condition","identifier_exists","product_type"],t=T.map(i=>{const m=u.get(i.category)||i.category,h=k(i,m),p=r==="wholesale"?i.wholesalePrice:i.retailPrice,b=i.stock>0||i.isMadeToOrder?"in_stock":"out_of_stock",y=A(i),_=i.sku||i.id,C=i.imageUrl||"https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80";return[g(_),g(i.name).slice(0,150),g(h).slice(0,5e3),y,C,b,`${p.toFixed(2)} ${a}`,"Business & Industrial > Retail",g(d),"new","no",g(m)].join("	")});return"\uFEFF"+[f.join("	"),...t].join(`\r
`)}function S(e,o,n,s={}){const r=w(e,o,n,s),c=new Blob([r],{type:"text/tab-separated-values;charset=utf-8;"}),l=URL.createObjectURL(c),a=document.createElement("a"),d=new Date().toISOString().slice(0,10);a.href=l,a.download=`Google_Shopping_Feed_${n.name||"Titufaris"}_${d}.tsv`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(l)}function M(e,o){const n=A(e),s=e.stock>0||e.isMadeToOrder;return{"@context":"https://schema.org/","@type":"Product",name:e.name,image:[e.imageUrl],description:e.description||`${e.name} - Equipamiento comercial de fabricación directa.`,sku:e.sku,mpn:e.sku,brand:{"@type":"Brand",name:o.name||"Titufaris"},offers:{"@type":"Offer",url:n,priceCurrency:o.currency||"ARS",price:e.retailPrice,priceValidUntil:new Date(Date.now()+720*60*60*1e3).toISOString().slice(0,10),itemCondition:"https://schema.org/NewCondition",availability:s?"https://schema.org/InStock":"https://schema.org/OutOfStock",seller:{"@type":"Organization",name:o.name||"Titufaris"}}}}export{$ as a,w as b,S as c,D as d,M as g};
