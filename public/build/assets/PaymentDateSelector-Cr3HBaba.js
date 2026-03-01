import{d as a,j as o}from"./vendor-u-wfm9dq.js";const l=()=>new Date().toISOString().slice(0,10),m=()=>{const t=new Date;return t.setDate(t.getDate()-1),t.toISOString().slice(0,10)},p=[{key:"today",label:"Hoje",getDate:l},{key:"yesterday",label:"Ontem",getDate:m},{key:"custom",label:"Outro dia",getDate:()=>""}];function j({value:t,onChange:r,name:u="paid_date",className:x="",compact:c=!1}){const s=a.useMemo(l,[]),n=a.useMemo(m,[]),i=a.useMemo(()=>t===s?"today":t===n?"yesterday":t&&t!==s&&t!==n?"custom":null,[t,s,n]),[d,y]=a.useState(i==="custom"),g=a.useCallback(e=>{e.key==="custom"?(y(!0),(!t||t===s||t===n)&&r?.("")):(y(!1),r?.(e.getDate()))},[r,t,s,n]),f=a.useCallback(e=>{r?.(e.target.value)},[r]),b=c?"px-2.5 py-1 text-[11px] sm:text-xs":"px-3 py-1.5 text-xs sm:text-sm";return o.jsxs("div",{className:`space-y-2 ${x}`,children:[o.jsx("label",{className:`block font-medium text-gray-700 dark:text-gray-200 ${c?"text-xs":"text-sm"}`,children:"Quando pagou?"}),o.jsx("div",{className:"flex flex-wrap gap-2",children:p.map(e=>{const k=e.key==="custom"?d&&i==="custom":i===e.key;return o.jsx("button",{type:"button",onClick:()=>g(e),className:`
                ${b}
                rounded-lg font-medium transition-all duration-150
                focus:outline-none focus:ring-2 themed-ring focus:ring-offset-1
                ${k||e.key==="custom"&&d?"themed-selected shadow-sm":"bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}
              `,children:e.label},e.key)})}),d&&o.jsx("input",{type:"date",name:u,value:t||"",onChange:f,max:s,className:`
            w-full rounded-lg border border-gray-300 bg-white shadow-sm
            dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100
            focus:border-transparent focus:outline-none focus:ring-2 themed-ring
            ${c?"px-2.5 py-1.5 text-xs":"px-3 py-2 text-sm"}
          `,autoComplete:"off"}),!d&&t&&o.jsx("input",{type:"hidden",name:u,value:t})]})}export{j as P};
