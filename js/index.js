"use strict"

//const electron = require("electron/index")

const Datastore = require("nedb")
const path = require("path")
const FS = require("fs")
const ipcrenderer = require('electron').ipcRenderer

let dictnames = [
    {id:"C", lang:"E", name: "Concise P-E Dictionary", author: "Concise Pali-English Dictionary by A.P. Buddhadatta Mahathera"},
    {id:"I", lang:"E", name: "Pali-Dictonary from VRI", author: "Pali-Dictionary Vipassana Research Institute"},
    {id:"P", lang:"E", name: "PTS P-E Dictionary", author: "PTS Pali-English dictionary The Pali Text Society's Pali-English dictionary"},
    {id:"N", lang:"E", name: "Buddhist Dictionary", author: "Buddhist Dictionary by NYANATILOKA MAHATHERA"},
    {id:"V", lang:"E", name: "Pali Proper Names Dictionary", author: "Buddhist Dictionary of Pali Proper Names by G P Malalasekera"},
    {id:"K", lang:"E", name: "Tipiṭaka Pāḷi-Myanmar Dictionary", author: "Tipiṭaka Pāḷi-Myanmar Dictionary တိပိဋက-ပါဠိျမန္မာ အဘိဓာန္"},
    {id:"B", lang:"E", name: "Pali Myanmar Dictionary", author: "Pali Word Grammar from Pali Myanmar Dictionary"},
    {id:"O", lang:"E", name: "Pali Roots Dictionary", author: "Pali Roots Dictionary ဓါတ္အဘိဓာန္"},
    {id:"R", lang:"E", name: "U Hau Sein’s Pāḷi-Myanmar Dictionary", author: "U Hau Sein’s Pāḷi-Myanmar Dictionary ပါဠိျမန္မာ အဘိဓာန္(ဦးဟုတ္စိန္)"},
    {id:"U", lang:"E", name: "Pali Viet Dictionary", author: "Pali Viet Dictionary  Bản dịch của ngài Bửu Chơn."},
    {id:"Q", lang:"E", name: "Pali Viet Vinaya Terms", author: "Pali Viet Vinaya Terms  Từ điển các thuật ngữ về luật do tỳ khưu Giác Nguyên sưu tầm."},
    {id:"E", lang:"E", name: "Pali Viet Abhi- Terms", author: "Pali Viet Abhidhamma Terms  Từ điển các thuật ngữ Vô Tỷ Pháp của ngài Tịnh Sự, được chép từ phần ghi chú thuật ngữ trong các bản dịch của ngài."},
    {id:"H", lang:"C", name: "《汉译パーリ语辞典》", author: "汉译パーリ语辞典 黃秉榮譯"},
    {id:"T", lang:"C", name: "《汉译パーリ语辞典》", author: "汉译パーリ语辞典 李瑩譯"},
    {id:"S", lang:"C", name: "《パーリ语辞典》", author: "パーリ语辞典 日本水野弘元"},
    {id:"A", lang:"C", name: "《パーリ语辞典》", author: "パーリ语辞典 增补改订 日本水野弘元"},
    {id:"J", lang:"C", name: "《パーリ语辞典-勘误表》", author: "《水野弘元-巴利语辞典-勘误表》 Bhikkhu Santagavesaka 覓寂尊者"},
    {id:"M", lang:"C", name: "《巴利语汇解》", author: "巴利语汇解&巴利新音译 玛欣德尊者"},
    {id:"D", lang:"C", name: "《巴汉词典》", author: "《巴汉词典》Mahāñāṇo Bhikkhu编著"},
    {id:"F", lang:"C", name: "《巴汉词典》", author: "《巴汉词典》明法尊者增订"},
    {id:"G", lang:"C", name: "《巴利语字汇》", author: "四念住课程开示集要巴利语字汇（葛印卡）"},
    {id:"W", lang:"C", name: "《巴英术语汇编》", author: "巴英术语汇编 《法的医疗》附 温宗堃"},
    {id:"Z", lang:"C", name: "《巴汉佛学辞汇》", author: "巴利文-汉文佛学名相辞汇 翻译：张文明"},
    {id:"X", lang:"C", name: "《巴利语入门》", author: "《巴利语入门》释性恩(Dhammajīvī)"},
]

let t1

let engbndict, engbndict2
//to store dbpath and db later
let previous = {
    dbpath: null,
    db: null
}

let paliinfo

let searchhistory = [] //history of search words
let currentwordindex = null

window.onload = ()=>{
    t1 = performance.now()
    paliinfo = document.querySelector("#paliinfo")
    document.querySelector("#paliinput").disabled = false

    attachListners()
    loadEngBNDB()
    loadEngBNDB2()
    //let char = "হ"
    //showbutton(char)
    
}

function attachListners(){
    let paliinput = document.querySelector("#paliinput")
    paliinput.onkeydown = (e)=>{
        //console.log(e.keyCode)
        //on enter, start handling input
        if(e.keyCode == "13") handlePaliInput(paliinput)
    }

    let enginput = document.querySelector("#enginput")
    enginput.oninput = ()=>{
        findEngWord(enginput.value)
    }


    //set text selection listener
    let wordmeaning = document.getElementById("wordmeaning")
    wordmeaning.onmouseup = ()=>{
        let text = getSelectedText()
        if(text != ""){
            enginput.value = text
            findEngWord(text)
        }
    }
    
    //set prev and next click listener
    let prevword = document.querySelector("#prevword")
    prevword.onclick = ()=>{
		if(currentwordindex == null) return
		if(currentwordindex > 0)showWordFromHistory(currentwordindex-1)
	}
    let nextword = document.querySelector("#nextword")
    nextword.onclick = ()=>{
		if(currentwordindex == null) return
		if(currentwordindex < searchhistory.length-1)showWordFromHistory(currentwordindex+1)
	}

    let startbtn = document.querySelector("#startbtn")
    startbtn.onclick = ()=>{
        handlePaliInput(paliinput)
    }
    
}

function showWordFromHistory(wordindex){
	let word = searchhistory[wordindex]
    
    //set in input
    document.querySelector("#paliinput").value = word
    //set current word index
    currentwordindex = wordindex
    
    //pricess
    processTextNew(word)
    
}

function findEngWord(engtext){

    engtext = engtext.trim()
    if(engtext == null || engtext.length == 0) return

    let engmeaningdiv = document.querySelector("#engmeaning")
    let wordobj = engbndict.find(obj => {return obj.en.toLowerCase() == engtext.toLowerCase()} )
    let wordobj2 = engbndict2.find(obj => {return obj.en.toLowerCase() == engtext.toLowerCase()} )
    
    let html = ""

    if(wordobj != null){
       html += "<b>"+engtext +"</b> = "+ wordobj.bn+" => "+wordobj.bn_syns.join(", ")+"<br>"
    }
    if(wordobj2 != null){
        html += "<b>"+engtext +"</b> = "+ wordobj2.bn+"<br>"
     }
    
     engmeaningdiv.innerHTML = html
}
function getSelectedText(){
    if(window.getSelection){
        return window.getSelection().toString()
    }
    else if(document.selection){
        return document.selection.createRange().text
    }

    return ""
}
function loadEngBNDB(){
    const engbndbpath = path.join(process.resourcesPath,"assets","db.json")
    FS.readFile(engbndbpath, 'utf-8', (err, data)=>{
        engbndict = JSON.parse(data)
        let loadingtime = ((performance.now()-t1)/1000).toFixed(2)
        paliinfo.innerHTML += "<br>Loading finished in "+loadingtime+" seconds"

    })
}
function loadEngBNDB2(){
    const engbndbpath2 = path.join(process.resourcesPath,"assets","E2Bdatabase.json") 
    FS.readFile(engbndbpath2, 'utf-8', (err, data)=>{
        engbndict2 = JSON.parse(data)
        let loadingtime = ((performance.now()-t1)/1000).toFixed(2)
        paliinfo.innerHTML += "<br>Loading finished in "+loadingtime+" seconds"

    })
}
function handlePaliInput(inputelement){
    t1 = performance.now()

    let value = inputelement.value.trim()
    //console.log(value)
    if(value == null || value.length == 0) return

    preProcessInput(value)
}

function preProcessInput(value){
	//else store it in the search history
    searchhistory.push(value)
    
    //store current word index, to be used later 
    currentwordindex = searchhistory.lastIndexOf(value)
    
    //process text
    processTextNew(value)
}

function processTextNew(bntext){
    //get first char and find the directory of siongui
    let firstchar = [...bntext][0]
    const folderpath = path.join(process.resourcesPath,"assets","db",firstchar,"/") 
    
    findAllFilesWithFirstandSecondChar(folderpath, firstchar, bntext)
}

/**
 * Find all files containing at least first two chars,
 * and find all the docs containing the bntext
 * and then sort them and show them
 */
function findAllFilesWithFirstandSecondChar(folderpath, firstchar, bntext){
    FS.readdir(folderpath, (err, files)=>{
        if(err) return console.log(err)

        paliinfo.innerHTML = firstchar+", "+bntext+" "+files.length
        paliinfo.innerHTML += "<br> searching... please wait."
        //filter out unnecessary files
        files = files.filter(file => !file.endsWith("~"))
        //console.log(files)
        let file = findfilebnNew(files, bntext)
        console.log(file)

        if(file) {
            let mfiles = [file]
            getDocsFromFilelist(mfiles, firstchar, bntext).then(docs=>{
                console.log(docs.length)
                if(docs.length > 0) prepagreMacthedDocs(docs)
                else {
                    let loadingtime = ((performance.now()-t1)/1000).toFixed(2)
                    paliinfo.innerHTML = "<br> Search ended... time elpased "+loadingtime+"s."
                    paliinfo.innerHTML += "<br> 0 words found. You may try with different spelling."
                    
                }
            }).catch(err => console.log(err))
        } 
        else alert("file not found for "+bntext)
    })
}
function prepagreMacthedDocs(matcheddocs){
    let loadingtime = ((performance.now()-t1)/1000).toFixed(2)
    //paliinfo.innerHTML += "<br> preparing docs... time elpased "+loadingtime+"s. please wait."

    let mdgroups = {}
    for(let i=0; i< matcheddocs.length; i++){
        //console.log(matcheddocs[i].paliwordbn)
        //let pword = matcheddocs[i].paliword

        let pword = matcheddocs[i].paliwordbn

        let doc = matcheddocs[i]

        if(Object.keys(mdgroups).includes(pword)){
            mdgroups[pword].push(doc)
        }
        else{
            mdgroups[pword] = [doc]
        }

        if(i == matcheddocs.length-1){
            //handleMatchedDocs(mdgroups)
            showBnWordlist(mdgroups)
        }
    }
}
function getDocsFromFilelist(filelist, firstchar, bntext){
    let loadingtime = ((performance.now()-t1)/1000).toFixed(2)
    //paliinfo.innerHTML += "<br> getting docs from filelist... time elpased "+loadingtime+"s. please wait."

    let doclist = []
    return new Promise((resolve,reject)=>{
        let fileindex = 0
        handlefile(fileindex)

        function handlefile(fileindex){
            if(fileindex < filelist.length){
                //console.log("handling file "+filelist[fileindex]+" at "+fileindex)
                let dbfile = filelist[fileindex]
                const dbpath = path.join(process.resourcesPath,"assets","db",firstchar,dbfile)
                
                getFilteredDBDocsNew(dbpath, bntext).then(docs=>{
                    doclist.push(...docs)
                    
                    let loadingtime = ((performance.now()-t1)/1000).toFixed(2)
                    //paliinfo.innerHTML += "<br> getting filtered dbdocs from dbfile "+dbfile+"... time elpased "+loadingtime+"s. please wait."


                    fileindex++
                    handlefile(fileindex)
                })
                .catch(err =>{
                    console.log(err)
                    fileindex++
                    handlefile(fileindex)
                })
            }
            else resolve(doclist)
        }

    })
}
function getFilteredDBDocsNew(dbpath, bntext){
    //console.log("doing for ", dbpath)
    console.log("filtering dbdocs for "+bntext)
    if(bntext.includes("ল়্"))bntext = bntext.split("ল়্").join("")
    else if(bntext.includes("ৰ্"))bntext = bntext.split("ৰ্").join("")
    
    console.log("finding for "+bntext)
    
    return new Promise((resolve,reject)=>{
        let db = getDB(dbpath)
        findAllDocs(db).then(docs=>{
            let matcheddocs = docs.filter(doc=> doc.paliwordbn.startsWith(bntext))
            matcheddocs.sort((a,b)=>a.paliwordbn.localeCompare(b.paliwordbn))
            //console.log(matcheddocs.length)
            resolve(matcheddocs)
        }).catch(err =>reject(err))
    })
}

function findfilebnNew(files, textbn){
    //Traverse the array of files
    for(let i=0; i<files.length; i++){
        let fparts = files[i].split("_")
        let firstname = fparts[0]
        let lastname = fparts[1]

        let names = [textbn, firstname, lastname].sort((a,b)=> compareBN(a,b))

        //if textbn is found inside the file
        if(textbn == firstname || textbn == lastname || textbn == names[1]) return files[i]

        if(i == files.length-1) return null
    }
    
}

function compareBN(a,b){
    return a.localeCompare(b,"bn")
}

function getDB(dbpath){
    let db

    if(previous.dbpath == dbpath){ //check previous dbpath if already opened
        db = previous.db
        return db
    }
    else{
        let db = getDBFromPath(dbpath)
        previous.dbpath = dbpath //store for later check
        previous.db = db
        return db
    }

    function getDBFromPath(filepath){
        const db = new Datastore({filename: filepath})
        db.loadDatabase()
        return db
    }
}
function findAllDocs(db){
    return new Promise((resolve, reject)=>{
        db.find({}, function(err, docs){
            if(err) reject(err)
            resolve(docs)
         })
    })
}


function showBnWordlist(mdbngroups){
    let loadingtime = ((performance.now()-t1)/1000).toFixed(2)
    //paliinfo.innerHTML += "<br> showing BnWordlist... time elpased "+loadingtime+"s. please wait."

    let html = ""
    let bnwords = Object.keys(mdbngroups).sort()
    
    let wordlist = document.getElementById("wordlist")
    wordlist.innerHTML = ""

    let palioptions = document.getElementById("palioptions")
    palioptions.innerHTML = ""

    for(let i=0; i<bnwords.length; i++){
        let bnword = bnwords[i]
        let bnworddocs = mdbngroups[bnword]
        wordlist.appendChild(getLi(i, bnword, bnworddocs))

        if(i == bnwords.length-1){
            let loadingtime = ((performance.now()-t1)/1000).toFixed(2)
            paliinfo.innerHTML = "<br> Search ended... time elpased "+loadingtime+"s."
            paliinfo.innerHTML += "<br> "+bnwords.length+" words found. You may try with different spelling."
        }
    }

    function getLi(i, bnword, bnworddocs){
        let li = document.createElement("li")
        li.classList = "wordli"
        li.innerHTML = bnword

        li.onclick = ()=>{
            showMeaning(bnworddocs)
        }

        return li
    }

    function showMeaning(bnworddocs){
        let wordmeaning = document.getElementById("wordmeaning")
        wordmeaning.innerHTML = ""

        //sort meanings by dictnames order
        function sortbydictnames(a,b){
            //a.dictid //find index in dictnames
            let adict = dictnames.find(dic => dic.id == a.dictid)
            let bdict = dictnames.find(dic => dic.id == b.dictid)
            let aindex = dictnames.indexOf(adict)
            let bindex = dictnames.indexOf(bdict)

            return aindex - bindex
        }
        bnworddocs.sort(sortbydictnames)

        for(let i=0; i<bnworddocs.length; i++){
            let li = getMeaningLi(bnworddocs[i])
            wordmeaning.appendChild(li)
        }
    }

    function getMeaningLi(bnworddoc){
        let dictid = bnworddoc.dictid
        //let dictlang = bnworddoc.dictlang
        let explanation = bnworddoc.explanation
        //let fuzzyspelling = bnworddoc.fuzzyspelling
        //let paliword = bnworddoc.paliword
        //let paliwordalt = bnworddoc.paliwordalt
        //let rownum = bnworddoc.rownum
         
        let li = document.createElement("li")
        li.classList = "meaningli"
        if(dictid == "K" || dictid == "B" || dictid == "O" || dictid == "R") {
			li.classList.add("burmese")
			explanation = Z1_Uni(explanation)
			li.innerHTML = explanation+ "<br><b>-"+dictnames.find(dict=>dict.id == dictid).name+"</b>"
		}
        else{
			li.classList.add("english")
			li.innerHTML = explanation+ "<br><b>-"+dictnames.find(dict=>dict.id == dictid).name+"</b>"
		}
        
        return li
    }
}


function removeProgressBar(){
    document.querySelector("#progressbar").innerHTML = ""
}


function showAlertBox(){
    alert("প্রোগ্রাম নির্মাতা: জ্ঞানশান্ত ভিক্ষু, \n Email: schakma94@gmail.com \n ধর্মদান সকল দানকে জয় করে।")
}

ipcrenderer.on("show-about-alertbox", showAlertBox)
