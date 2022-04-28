"use strict"

/**
 * User interface manager
 * */
class UIM {
    showList(list) {
        let ol = document.querySelector("#cittalist")
        for (let i = 0; i < list.length; i++) {
            let li = document.createElement("li")
            li.innerHTML = list[i].name
            ol.appendChild(li)
        }
    }
    showCittasBySphere(cittasBySphere){
        let ol = document.querySelector("#cittalist")
        let spheres = Object.keys(cittasBySphere)
        for (let i = 0; i < spheres.length; i++) {
            let spherecittas = cittasBySphere[spheres[i]] //array of cittas
            
            let h3 = document.createElement("h3")
            h3.innerHTML = spheres[i] + " SPHERE CITTAS (" +spherecittas.length+" )" 
            ol.appendChild(h3)

            for(let j=0; j<spherecittas.length; j++){
                let li = document.createElement("li")
                li.innerHTML = spherecittas[j].name
                ol.appendChild(li)
            }
            
        }
    }
}