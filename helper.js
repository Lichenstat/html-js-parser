// helper class with various methods for using and getting various info about objects and elements

export { Helper }

class Helper{

    // just test helper for a console log
    static testConsoleLog(){
        console.log("test console log");
    }

    // function to match case object contents to a desired property to see if it exists
    static doesObjectContainProperty(object, propertyName){
        //console.log(object, propertyName);
        // if the object has the property
        if (object.hasOwnProperty(propertyName)){
            return true;
        }
        // otherwise check the other objects in the object (checking nested objects)
        for (var key in object){
            if (typeof object[key] === 'object'){
                return this.doesObjectContainProperty(object[key], propertyName);
            } 
        }
        return false;
    }

    // to simply print the name of an object if it is desired in certain functions
    static #doesWantNameOfObject(bool, objectName){
        if (bool){
            return (objectName + ' <- ');
        }
        return '';
    }

    // function to retrieve a property or given properties from a given object using keys (can find nested properties)
    static getObjectPropertyByName(object, propertyName, showWhereDerivedFrom = false, parentName = object.constructor.name){
        let objectArray = [];
        let objectLastPosition = Object.keys(object).length - 1;
        for (var key in object){
            // check other objects in the object (checking for nested objects)
            if (typeof object[key] === 'object'){
                return objectArray.concat(this.getObjectPropertyByName(object[key], propertyName, showWhereDerivedFrom, this.#doesWantNameOfObject(showWhereDerivedFrom, parentName) + key));
            }
            // check if the object property does exist and return it if it does
            if (key === propertyName){
                let overallName = this.#doesWantNameOfObject(showWhereDerivedFrom, parentName) + [propertyName];
                objectArray.push({[overallName] : object[key]});
            }
            // if cycling through the object has found the last position, return the matching objects
            if (object[objectLastPosition] === object[key]){
                return objectArray;
            }
        }
        return objectArray;
    }

    // function to help with printing object information to html
    static getObjectInfo(object){
        let text = '';
        for(var key in object){
            text = text + key + ': ' + object[key] + '<br>';
        }
        return text;
    }

    // parse an element id for a location inside a matrix
    // (assumes between parenthesis, ex: (14,7))
    static parseElementIdForMatrixLocation(id){
        var row, col;
        let matrix = id.substring(id.indexOf('('), id.indexOf(')') + 1);
        row = Number(matrix.substring(matrix.indexOf('(') + 1, matrix.indexOf(',')));
        col = Number(matrix.substring(matrix.indexOf(',') + 1, matrix.indexOf(')')));
        return [row, col];
    }

    // parse part of a string and replace that part with a desired string
    static parsePartOfStringToReplace(originalString, partToReplace, replaceWith){
        return originalString.replace(new RegExp(partToReplace, 'g'), replaceWith).toString();
    }

    // parse class or id to change it's modifier in BEM format for enabling or disabling 
    static setModifierOfClassOrId(classOrId){
        let change = classOrId.toString().match(/--disabled|--enabled/g);
        change = change.toString();
        if (change == '--disabled'){
            return classOrId.replace(/--disabled/g, '--enabled');
        }
        if (change == '--enabled'){
            return classOrId.replace(/--enabled/g, '--disabled');
        }
    }

    // remove words from a string via a given array of strings
    static removeWordsFromString(words, string){
        return words.reduce((result, word) => result.replaceAll(word, ''), string);
    }

    // remove all spaces from a string
    static removeAllSpacesFromString(string){
        string = string.replace(/[ ]*/g, '');
        return string;
    }

    // remove duplicates in an array using a desired remove duplicates array
    static removeDuplicatesFromArrayUsingArray(arrayToClean, arrayForChecking){
        arrayForChecking.filter(
            (itemDuplicate, indexFromDuplicate) => {
                arrayToClean.filter(
                    (item, index) => {
                        if(item == itemDuplicate){
                            arrayToClean.splice(index, 1);
                        }
                    }
                )
            }
        );
        return arrayToClean;
    }

    // check if arrays are equal by position and size
    static checkIfArraysAreEqual(arrayOne, arrayTwo){
        let arrOne = arrayOne.length;
        let arrTwo = arrayTwo.length;
        if (arrOne == arrTwo){
            for (var i in arrayOne){
                if (arrayOne[i] != arrayTwo[i]){
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    // get index locations of match cases in a, array/string
    static getIndexLocationsOfMatchCase(matchCase, string){
        let markedIndex = [];
        var result;
        let pattern = new RegExp(matchCase, 'gi');
        while((result = pattern.exec(string))){
            markedIndex.push(result.index);
        }
        return markedIndex;
    }

    // merge index locations together replacing their indexes with strings
    static getStringsInOrderViaIndexArray(indexArrOne, wordOne, indexArrTwo, wordTwo){
        let finalArray = [];
        let arrOneLoc = 0;
        let arrTwoLoc = 0;
        let combinedLength = indexArrOne.length + indexArrTwo.length;
        let loop = 0;
        while(loop < combinedLength){
            loop = loop + 1;
            let ione = indexArrOne[arrOneLoc];
            let itwo = indexArrTwo[arrTwoLoc];
            if( ione <= itwo ){
                finalArray.push(wordOne);
                arrOneLoc = arrOneLoc + 1;
            }
            else{
                finalArray.push(wordTwo);
                arrTwoLoc = arrTwoLoc + 1;
            }
        }
        return finalArray;
    }

}
