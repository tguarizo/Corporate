const node=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e};
export function renderMaterials(container,materials){
 container.replaceChildren();container.classList.toggle('hidden',!materials?.length);
 for(const material of materials||[]){
  const figure=node('figure','case-document '+material.kind);const heading=node('figcaption','document-title',material.title);figure.append(heading);
  if(material.kind==='room'){const image=document.createElement('img');image.src='/assets/room-inspection.svg';image.alt='Plano da sala: porta aberta para o corredor, ficha de Carlos sobre a mesa e ficha de Ana na tela.';image.width=800;image.height=420;figure.append(image)}
  const fields=node('dl','document-fields');for(const [label,value] of material.fields){const field=node('div','document-field');field.append(node('dt','',label),node('dd','',value));fields.append(field)}figure.append(fields);container.append(figure);
 }
}
