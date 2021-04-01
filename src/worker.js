const NEW_EMAIL_WAS_FOUND = true;

export const fetchList = async (data) => { // eslint-disable-line no-restricted-globals
    let {fqdn, authDetails, EMAILS_LIST_URL, emailSet} = data;
    await fetch(`${EMAILS_LIST_URL}?domain=${fqdn}&folderpath=/email`,{
      headers: {'Authorization':authDetails.id_token},
    }).then((response)=> response.json())
    .then(async (response) => { 
      if(response.Contents.length > 0 && emailSet && response.Contents[0].Key !== emailSet[0].Key){ 
        console.log("new email found")
          postMessage({NEW_EMAIL_WAS_FOUND});
        };
    })
};