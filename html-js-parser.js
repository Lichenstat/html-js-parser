// class made in an attempt to parse an html string through js using regular expressions to add/remove/change things

import {Helper} from './Helper.js';

export {htmlJsParser}

class htmlJsParser{
    // eliminate everything between <...> signs in a string (for use with html js strings)
    // return example would be <><><></></>
    static getHtmlStripped(string){
        // remove anything that isn't <, >, or /
        let strippedHtml = string.replace(/[^<>\/]/g, '');
        // remove all desired cases (<> and </>)
        let unwantedHtml = strippedHtml.replace(/<>/g, '  ');
        unwantedHtml = unwantedHtml.replace(/<\/>/g, '   ');
        // create finalized string using unwatned html as a check
        let finalizedHtmlReduction = '';
        let len = strippedHtml.length;
        for (let i = 0; i < len; i++){
            if (unwantedHtml[i] == " "){
                finalizedHtmlReduction = finalizedHtmlReduction + strippedHtml[i];
            }
        }
        return finalizedHtmlReduction;
    }

    // get the tag of the current desired html element if it has  amatch case
    static getHtmlStartingAndEndingTagOfAttribute(string, classOrId){
        // beginning portion of this is simply to get get proper tag to begin indexing
        let elementTag = string.match(new RegExp('<.*' + classOrId, 'g'));
        elementTag = elementTag.toString();
        elementTag = elementTag.slice(elementTag.lastIndexOf('<'));
        elementTag = elementTag.match(/<\w+/g);
        let beginningTag = elementTag.toString();
        let endingTag = beginningTag.replace(/</g, '</');
        endingTag = endingTag.toString().replace(/ /g, '');
        endingTag = endingTag.toString();
        return [beginningTag, endingTag];
    }

    // get indexes of a tags beginning and ending
    static getHtmlTagStartingAndEndingIndexes(htmlString, classOrId){
        let tags = this.getHtmlStartingAndEndingTagOfAttribute(htmlString, classOrId);
        let beginningTag = tags[0];
        let endingTag = tags[1];
        // get array of tag index locations, as well as make combined tag array to check for pattern matching
        let beginningTagIndexes = Helper.getIndexLocationsOfMatchCase(beginningTag, htmlString);
        let endingTagIndexes = Helper.getIndexLocationsOfMatchCase(endingTag, htmlString);
        let allTags = Helper.getStringsInOrderViaIndexArray(beginningTagIndexes, beginningTag, endingTagIndexes, endingTag);
        let allTagIndexes = beginningTagIndexes.concat(endingTagIndexes).sort();
        // get our indexed tag directly to know where to slice tag array
        var firstTagIndex = (htmlString.split(classOrId)[0]).lastIndexOf(beginningTag);
        var tagIndexLocation = allTagIndexes.indexOf(firstTagIndex) + 1;
        let tagToRest = allTags.slice(tagIndexLocation);
        //console.log('tag: ', beginningTag, beginningTagIndexes, endingTag, endingTagIndexes, allTags, allTagIndexes);
        // check the amount of tags we throw away to help later in the placement of our content
        var tagCountAfterSplice = allTags.length - tagToRest.length;
        var marker = 0;
        // get to ending tag of the element and mark the locations ending tag index
        for (var i in tagToRest){
            if(tagToRest[i] == beginningTag){
                marker = marker + 1;
            }
            if(tagToRest[i] == endingTag){
                marker = marker - 1;
            }
            if(marker <= -1){
                marker = tagCountAfterSplice + Number(i);
                break;
            }
        }
        // get the index of the location of the ending tag and append internal contents to html string
        let lastTagIndex = htmlString.indexOf(endingTag, allTagIndexes[marker]);
        //console.log(htmlString.substring(firstTagIndex, lastTagIndex));
        return [firstTagIndex, lastTagIndex];
    }

    // get the tags in an html element
    static getHtmlTagsOfElements(string){
        let partiallyCleaned = string.match(/<{1}\/{0,1}\w+/g);
        return partiallyCleaned;
    }

    // get the end case of the attributes of html elements
    static getHtmlEndingAttributesOfElements(string){
        let changedString = this.getHtmlCleanedTagAttributes(string);
        let htmlAttributes = this.getHtmlAttributesOfElements(string);
        let htmlEndingAttributes = []
        htmlAttributes.filter(
            attribute =>
            {
                attribute = this.#getRegExpParenthesis(attribute);
                attribute = new RegExp(attribute + ' *>');
                let attributeEnd = changedString.match(attribute);
                if(attributeEnd){
                    htmlEndingAttributes.push(attributeEnd.toString());
                    changedString = changedString.replace(new RegExp('.*' + attributeEnd), '');
                }
            }
        );
        return htmlEndingAttributes;
    }

    // get the values of the attributes in the html tags
    static getHtmlAttributesOfElements(string){
        let partiallyCleaned = this.getHtmlCleanedTagAttributes(string);
        partiallyCleaned = partiallyCleaned.match(/\w+=\"[^"]+\"|[^0-9\s\W]+=\d+|disabled(?=(\s*>))|enabled(?=(\s*>))/g);
        return partiallyCleaned;
    }

    // clean up tag attributes if necessary
    static #getHtmlCleanedTagAttributes(string){
        let partiallyCleaned = string.replace(/=\s+"|\s+="/g, '="');
        partiallyCleaned = partiallyCleaned.replace(/\s+=/g, '=');
        partiallyCleaned = partiallyCleaned.replace(/=\s+/g, '='); // shrinks equations = spaces down, attempted fix in #returnHtmlInternalsToNormal
        return partiallyCleaned;
    }

    // clean up string parenthesis for regexp use
    static #getRegExpParenthesis(string){
        string = string.replace(/\(/g, '\\(');
        string = string.replace(/\)/g, '\\)');
        return string;
    }

    // get internal html content between elements
    static getHtmlInternalContents(string){
        let partiallyCleaned = this.#getHtmlCleanedTagAttributes(string);
        let htmlTags = this.getHtmlTagsOfElements(string);
        let htmlEndingAttributes = this.getHtmlEndingAttributesOfElements(string);
        let htmlInternalContents = [];
        let tagLen = htmlTags.length;
        // check what comes after tag #1 and before tag #2 (including these tags themselves), dont worry about last closing tag
        for (let i = 0; i < tagLen - 1; i++){
            let patternMatch = new RegExp(htmlTags[i] + '.*?' + htmlTags[i+1]);
            // match tag and pattern
            let patternExists = partiallyCleaned.match(patternMatch);
            // if the pattern exists
            if(patternExists){
                let patternFound = patternExists.toString();
                let usesNoAttributes = patternFound.match(htmlTags[i] + ' *>');
                // check if the internals can be filtered via given attributes
                if(!usesNoAttributes){
                    for(let j = 0; j < htmlEndingAttributes.length; j++){
                        // get our current attribute and replace any troublesome symbols with readable regexp syntax
                        let currentAttribute = htmlEndingAttributes[j];
                        currentAttribute = this.#getRegExpParenthesis(currentAttribute);
                        // can we use our current attribute to find a pattern?
                        let patternMatch = new RegExp('.*?' + currentAttribute);
                        let patternDoesMatch = patternFound.match(patternMatch);
                        if(patternDoesMatch){
                            // if there is a match splice the attribute array by our current readable attribute to shorten loop times
                            htmlEndingAttributes.splice(j ,1);
                            // replace our found <tag to <tag pattern arrtribute portion with empty string and push
                            // to save tag internals including <tag ending to pattern match for later
                            patternFound = patternFound.replace(patternDoesMatch, '');
                            htmlInternalContents.push(patternFound);
                            // replace the found internals <tag ending with empty string and append to our current attribute pattern
                            patternFound = patternFound.replace(htmlTags[i+1], '');
                            patternDoesMatch = patternDoesMatch + patternFound;
                            // replace the original string that includes our attribute all the way up to the ending <tag of that pattern
                            partiallyCleaned = partiallyCleaned.replace(patternDoesMatch, '');
                            // we have used an attribute to get the string internals, mark that we have and break from the loop
                            break;
                        }
                    }
                }
                if(usesNoAttributes){
                    // we rewrite the regexp pattern to include an ending portion on the first tag
                    let tagPattern = new RegExp(htmlTags[i] + ' *?>.*?' + htmlTags[i+1]);
                    // we then find a pattern and replace the first <tag portion and push it as internals to be used
                    patternFound = partiallyCleaned.match(tagPattern);
                    patternFound = patternFound.toString();
                    patternFound = patternFound.replace(new RegExp(htmlTags[i] + ' *>'), '');
                    htmlInternalContents.push(patternFound);
                    // we then take the original pattern and remove it's ending <tag, and replace the original string pattern portion with an empty string
                    patternMatch = patternMatch.toString();
                    patternMatch = patternMatch.replace(htmlTags[i+1], '');
                    partiallyCleaned = partiallyCleaned.replace(patternMatch, '');
                }
            }
        }
        // return the equals to normal in the given strings
        //htmlInternalContents = this.removeDuplicatesFromArrayUsingArray(htmlInternalContents, htmlTags);
        htmlInternalContents = this.#returnHtmlInternalsToNormal(htmlInternalContents, string);
        // finally we can return all intenal contents
        return htmlInternalContents;
    }

    // return given array of strings containing '=' back to the original format it was in (made mostly for internal html strings)
    // *** WARNING *** Cannot parse multiple ********* in a row, regexp issue, possible fix later
    static #returnHtmlInternalsToNormal(modifiedStringArray, originalString){
        modifiedStringArray.filter(
            (str, index) => {
                let strFixed = this.#getRegExpParenthesis(str)
                let stringMatch = str.match(/=/g);
                // if a given string has = in it
                if(stringMatch){
                    let fixed = false;
                    let strSplit = strFixed.split('=');
                    // create pattern for checking
                    let pattern = new RegExp(strSplit[0] + '.*?=.*?' + strSplit[strSplit.length - 1]);
                    let possibleString = originalString.match(pattern);
                    if(possibleString){
                        // pattern match and find possible errors to watch out for (mostly = at the beginning of the internal string)
                        possibleString = possibleString.toString();
                        let errorCheck = false;
                        let errorString = str.match(/[ *.+]*?=+.*/g);
                        errorString = errorString.toString();
                        // if the error pattern matches the ending str, return the original string internals after modification
                        errorCheck = (str == errorString);
                        // if a proper string that can be used is found
                        if(!errorCheck){
                            modifiedStringArray[index] = possibleString;
                            fixed = true;
                        }
                        // if no matching string from the original can be used
                        // just add spaces to the original internal string around =
                        if(errorCheck && !fixed){
                            errorString = possibleString.replace(/.*>/, '');
                            modifiedStringArray[index] = errorString;
                            fixed = true;
                        }
                    };
                    // if a pattern can't be found just use the original string and put spaces between the = signs
                    if(!fixed){
                        modifiedStringArray[index] = str.replace(/=/g, ' = ');
                        fixed = true;
                    }
                }
                // cut original string to avoid possible errors
                let removePattern = new RegExp('.*' + strFixed);
                originalString = originalString.replace(removePattern, '');
            }
        );
        return modifiedStringArray;
    }

    // returns a cleaned copied html string
    // format must have tags descripton right by beginning of < such as <div, as well as onclick etc. string patterns in
    // single quotes. ex: <e><div class="abc" id="1" onclick="if(1>3){console.log('here')}" enabled> something else </div></e>
    static getHtmlCleanedCopy(string){
        let spacelessString = Helper.removeAllSpacesFromString(string);
        let tags = this.getHtmlTagsOfElements(string);
        let attributes = this.getHtmlAttributesOfElements(string);
        let endAttributes = this.getHtmlEndingAttributesOfElements(string);
        let combinedAttributes = [];
        let internalContents = this.getHtmlInternalContents(string);
        // combine attributes with their known endings then slice to get entire attributes of a tag
        let attEndLength = endAttributes.length;
        for (let i = 0; i < attEndLength; i++){
            let collectAttribute = '';
            let foundMatch = false;
            let attLength = attributes.length;
            // go through the attributes and find out which ones go together
            for (let j = 0; j < attLength; j++){
                // check if an attribute is the final one in a element
                let match = endAttributes[i].match(this.#getRegExpParenthesis(attributes[j]));
                if(match){
                    // finish the attribute string for the element
                    foundMatch = true;
                    collectAttribute = collectAttribute + attributes[j];
                    attributes = attributes.slice(j + 1 , attLength);
                    break;
                }
                collectAttribute = collectAttribute + attributes[j] + ' ';
            }
            // push combined attributes onto array of finished attributes
            if(foundMatch){
                combinedAttributes.push(collectAttribute);
            }
        }
        // match tags/attributes/endings with their right places and append together
        let spacelessCombinedAttributes = [];
        combinedAttributes.filter((attribute, index) => spacelessCombinedAttributes.push(Helper.removeAllSpacesFromString(attribute)));
        let tagLength = tags.length - 1;
        let finalizedHtml = tags[0];
        for(let i = 0; i < tagLength; i++){
            let checkMatch = this.#getRegExpParenthesis(tags[i] + spacelessCombinedAttributes[0]);
            checkMatch = spacelessString.match(checkMatch);
            // if there is attributes in the tag, append string + attribute + content with ending
            if(checkMatch){
                finalizedHtml = finalizedHtml + ' ' + combinedAttributes[0] + '>' + internalContents[0];
                spacelessCombinedAttributes.shift();
                combinedAttributes.shift();
                internalContents.shift();
            }
            // if there aren't attributes in the tag
            if(!checkMatch){
                // combine html string + content with ending
                finalizedHtml = finalizedHtml + '>' + internalContents[0];
                internalContents.shift();
            }
        }
        finalizedHtml = finalizedHtml + '>';
        return finalizedHtml;
    }

    // add internal contents of a certain html string made in javascript using it's class or id at the end of the tag
    // assumes a js html string exists in such a format of <div class.. id=..><e></e><f></f></div>
    // will add content to very back of element (queue style). Maybe implement a stack style of appending later?
    static getHtmlInsertInternalContent(htmlString, contentToInsert, classOrId){
        let endingTagIndex = this.getHtmlTagStartingAndEndingIndexes(htmlString, classOrId)[1];
        let modifiedHtmlString = htmlString.slice(0, endingTagIndex) + contentToInsert + htmlString.slice(endingTagIndex, htmlString.length);
        return modifiedHtmlString;
    }

    // remove html content within some form of html element given a class or id of some type
    // *** appears to be broken for larger strings at the moment, keep in mind, will test later ***
    static getHtmlRemoveContent(htmlString, classOrId){
        // get tag indexes
        let tagIndexes = this.getHtmlTagStartingAndEndingIndexes(htmlString, classOrId);
        console.log(tagIndexes);
        console.log(htmlString.substring(tagIndexes[0], tagIndexes[1]));
        // get tag ending index by getting eind tag index beginning + tag ending + '>'
        var endingTagIndex = tagIndexes[1] + (this.getHtmlStartingAndEndingTagOfAttribute(htmlString, classOrId)[1].length) + 1;
        let modifiedHtmlString = htmlString.slice(0, tagIndexes[0]) + htmlString.slice(endingTagIndex, htmlString.length);
        return modifiedHtmlString;
    }
}