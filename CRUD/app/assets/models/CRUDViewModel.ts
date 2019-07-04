
console.log('VM')
// required dependencies  are in each script

declare var _start:any
declare var depp:any
declare var $:any
declare var disE1:any
declare var httpRPC:any

depp.require(['jquery'], spin)
var spinDiv = `
   <div class="centerSpin" id='spin'>
      <div class="spinner-border"></div>
   </div>`
function spin() {
   $('body').append( spinDiv )
}
function spinStop() {
   $('#spin').remove()
}
setTimeout(function() {
   spinStop()
}, 2000)


var tableData = [
   {id:1, name:'Mary May', age:'1', col:'blue' },
   {id:2, name:'Christine Lobowski', age:'42', col:'green'},
   {id:3, name:'Brendon Philips', age:'125', col:'orange' },
   {id:4, name:'Margret Marmajuke', age:'16', col:'yellow' },
]

disE1('gotData', tableData)

depp.require(['RPC'], function(){
   depp.done('VM')
})

class CRUDvm {
   // can be in services class so other VM can use
   rpc
   constructor() {
      var pro = window.location.protocol
      pro  = pro.replace(':','')
      var host = window.location.hostname
      var port = window.location.port
      this.rpc = new httpRPC(pro, host, 8888)
   }

   _all() {
      var prom = this.rpc.invoke('api', 'CRUDPg', 'selectAll', {a:5, b:2})
      // the most important step in the loading waterfall - after the first paint
      console.log('***', 'data in flight', Date.now() - _start)
      
      prom.then(function(resp) {
         console.log('resp', resp, Date.now() - _start)
      }).catch(function (err) {
         console.log('err', err)
      })
   }//()

   validate():string {
      return 'OK'
   }//()

}