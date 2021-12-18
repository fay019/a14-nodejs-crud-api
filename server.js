const express = require( 'express' );
const fs = require( 'fs' );
const validator = require( 'validator' );
const { nanoid } = require( 'nanoid' )
const converter = require( 'json-2-csv' );
const app = express();
const PORT = process.env.PORT || 6400;
let fileExtension = 'json';
let url, fileName, filePath, name, id, date;


app.listen( PORT, () => {
    console.log( 'Express-Server on ' + PORT )
} )

/**
 *  Read file for GET crud (read  and read one)
 * @param path {string} file path
 * @param res {object} response object
 * @param id {string} ID of birthday row//
 * if we don't have ID then we return all birthdays, else we make search and return only one
 */
let readMyFile = ( path, res, id ) => {
    console.log( typeof res )
    let myData;
    fs.readFile( path, ( err, data ) => {
        if ( err ) {
            return console.log( err );
        }
        if ( id ) {
            myData = JSON.parse( data )
            let result = myData.find( birthday => birthday.id === id );
            result ? res.status( 200 ).send( result ) : res.end( 'nothing found' )
        } else {
            res.status( 200 ).send( JSON.parse( data ) );
        } // String} }
    } );
}

app.use( express.static( 'public' ) );
app.use( express.urlencoded( { extended:false } ) )


// Routing -> URL, Methode was passiert, was ist Antwort

// Get Request for all
app.use( ( req, res, next ) => {
    url = req.url.split( '/' );
    ( req.params.fileName ) ? fileName = req.params.fileName : fileName = url[ 3 ];
    filePath = './data/' + fileName + '.' + fileExtension;
    date = req.body.date;
    name = req.body.name;
    next();
} )
// end Get request all
// Read all
app.get( `/crudapi/birthday/:fileName`, ( req, res ) => {
    fs.stat( filePath, ( err, stats ) => {
        if ( err ) {
            res.status( 404 ).end( 'file not found' );
        } else {
            readMyFile( filePath, res );
        }
    } )
} )
// end Read
// download csv file
app.get( `/crudapi/birthday/:fileName/csv`, ( req, res ) => {
    fs.stat( filePath, ( err, stats ) => {
        if ( err ) {
            res.status( 404 ).end( 'file not found' );
        } else {
            fs.readFile( filePath, ( req, data ) => {
                converter.json2csv( JSON.parse( data ), ( err, csv ) => {
                    if ( err ) {
                        throw err;
                    }
                    // print CSV string
                    console.log( JSON.parse( data, fileName ) )
                    console.log( csv );
                    res
                        .setHeader( "Content-Type", "text/csv" )
                        .setHeader( "Content-Disposition", `attachment; filename=${fileName}.csv` )
                        .status( 200 )
                        .send( csv );
                } );
            } )
        }
    } )
} )
//end download csv file
// Read one
app.get( `/crudapi/birthday/:fileName/:id`, ( req, res ) => {
    id = req.params.id;
    fs.stat( filePath, ( err, stats ) => {
        if ( err ) {
            res.status( 404 ).end( 'file not found' );
        } else {
            readMyFile( filePath, res, id );
        }
    } )
} )
// end Read one
// Create one
app.post( `/crudapi/birthday/:fileName`, ( req, res ) => {
    let result = validator.isDate( date );
    if ( result && name ) {
        id = nanoid();
        let incomeData = { id, name, date }
        fs.stat( filePath, ( err, stats ) => {
            // create file if 1st time use POST request
            if ( err ) {
                fs.appendFile( filePath, JSON.stringify( [ incomeData ] ), 'utf8', ( err => {
                    res.status( 201 ).send( { "ID":id } )
                } ) );
            } else {
                fs.readFile( filePath, ( err, data ) => {
                    let temp = JSON.parse( data );
                    temp.push( incomeData );
                    fs.writeFile( filePath, JSON.stringify( temp ), ( err, data ) => {
                        res.status( 201 ).send( { "ID":id } )
                    } )
                } );
            }
        } )
    } else {
        res.status( 405 ).end( 'Error with date or name' );
    }
} );
// end Creat
// Edit one // PUT and PATCH
/**
 *
 * @param req {object} Request object
 * @param res {object} Response object
 */
let myUpdate = ( req, res ) => {
    id = req.params.id;
    let myBool = false;
    fs.stat( filePath, ( err, stats ) => {
        if ( err ) {
            res.status( 404 ).end( 'file not found' );
        } else {
            fs.readFile( filePath, ( err, data ) => {
                let temp = JSON.parse( data );
                temp.forEach( ( x ) => {
                    if ( x.id === id ) {
                        name && ( x.name = name );
                        date && ( x.date = date );
                        return myBool = true;
                    }
                } )
                if ( myBool ) {
                    fs.writeFile( filePath, JSON.stringify( temp ), ( err ) => {
                        res.status( 202 ).send( { 'ID:':id } );
                    } );
                } else {
                    res.status( 404 ).end( 'ID not find' );
                }
            } )
        }
    } )

}
app.patch( '/crudapi/birthday/:fileName/:id', myUpdate );
app.put( '/crudapi/birthday/:fileName/:id', myUpdate );
// end Edit
// delete one
app.delete( '/crudapi/birthday/:fileName/:id', ( req, res ) => {
    id = req.params.id;
    let myBool = false;
    fs.stat( filePath, ( err, stats ) => {
        if ( err ) {
            res.status( 404 ).end( 'file not found' );
        } else {
            fs.readFile( filePath, ( err, data ) => {
                let temp = JSON.parse( data );
                temp = temp.filter( ( v, i ) => {
                    if ( v.id !== id ) {
                        return true;
                    } else {
                        myBool = true;
                        return false;
                    }
                } );
                if ( myBool ) {
                    fs.writeFile( filePath, JSON.stringify( temp ), ( err ) => {
                        if ( err ) {
                            res.status( 405 ).end( 'ERROR' );
                        }
                        res.status( 204 ).end( 'ID: ' + id + ' deleted' );
                    } );
                } else {
                    res.status( 404 ).send( 'ID: ' + id + ' not find' );
                }
            } )
        }
    } )
} );

// error path

// error link not find
app.use( ( req, res ) => {
    res.status( 404 ).sendFile( 'public/404.html', { root:__dirname } );
} );


