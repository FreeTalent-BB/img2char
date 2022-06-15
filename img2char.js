const FS = require( 'fs' );
const PATH = require( 'path' );
const { createCanvas, loadImage } = require( 'canvas' );

console.log( 'IMG2CHAR v1.0-0 by Baptiste Bideaux.' );
console.log( '------------------------------------' );
console.log( ' ' );

const myArgs = process.argv.slice(2);
if( myArgs.length == 0 )
{
    showHelp();
    process.exit( 0 );
}

var imgFile = checkImage();
var canvas = undefined;
var ctx = undefined;
var imgSource = undefined;
var n = 128;
var c = '#FFFFFF';
var s = 0;
var m = 'cpc';
var ns = 32;
var o = PATH.dirname( imgFile );

if( myArgs.length > 1 )
{
    for( var a = 1; a < myArgs.length; a++ )
    {
        var arg = myArgs[ a ];
        if( arg.indexOf( '-' ) != 0 )
        {
            console.log( 'ERROR: Invalid argument in ' + arg );
            process.exit( 1 );
        }

        if( arg.indexOf( '=' ) < 2 )
        {
            console.log( 'ERROR: Invalid argument in ' + arg );
            process.exit( 1 );
        }
        var command = arg.split( '=' )[ 0 ];
        var value = arg.split( '=' )[ 1 ];
        switch( command.toLowerCase() )
        {
            case '-n':
                if( isNaN( value ) )
                {
                    console.log( 'ERROR: Invalid value in "-n" argument. Integer waiting.' );
                    process.exit( 1 );
                }
                n = parseInt( value );
                break;

            case '-c':
                if( value.indexOf( '#' ) != 0 || value.length < 7 )
                {
                    console.log( 'ERROR: Invalid value in "-c" argument. HTML color waiting (#000000 - #FFFFFF).' );
                    process.exit( 1 );
                }
                c = value;
                break;

            case '-s':
                if( isNaN( value ) || value < 0 )
                {
                    console.log( 'ERROR: Invalid value in "-s" argument. Positive integer waiting.' );
                    process.exit( 1 );
                }
                s = parseInt( value );
                break; 

            case '-ns':
                if( isNaN( value ) || value < 0 )
                {
                    console.log( 'ERROR: Invalid value in "-ns" argument. Positive integer waiting.' );
                    process.exit( 1 );
                }
                ns = parseInt( value );
                break; 

            case '-m':
                switch( value.toLowerCase() )
                {
                    case 'cpc':
                    case 'atarist':
                    case 'thomson':
                    case 'vg5000':
                    case 'c64':
                        m = value.toLowerCase();
                        break;
                        
                    default:
                        console.log( 'ERROR: Invalid value in "-m" argument. "CPC", "VG5000", "THOMSON" or "C64" waiting.' );
                        process.exit( 1 );
                        break;
                }
                break;

            case '-o':
                if( !FS.existsSync( value ) )
                {
                    console.log( 'ERROR: Invalid value in "-o" argument. ' + value + ' path not exists.' );
                    process.exit( 1 );
                }
                o = value;
                break;                                       
        }
    }
}

var captureSettings = 
{
    'cpc':
    {
        width: 8,
        height: 8,
        headerBASIC: 
        [
            'SYMBOL AFTER SSTART',
            'FOR I=O TO ' + ( n - 1),
            'READ A$,B$,C$,D$,E$,F$,G$,H$',
            'SYMBOL ' + ns + '+I,VAL("&"+A$),VAL("&"+B$),VAL("&"+C$),VAL("&"+D$),VAL("&"+E$),VAL("&"+F$),VAL("&"+G$),VAL("&"+H$)',
            'NEXT I'
        ],
        dataBASIC: 'DATA %1,%2,%3,%4,%5,%6,%7,%8',
        endBASIC: undefined
    },

    'atarist':
    {
        width: 8,
        height: 8,
        headerBASIC: undefined,
        dataBASIC: undefined,
        endBASIC: undefined
    },

    'thomson':
    {
        width: 8,
        height: 8,
        headerBASIC: 
        [
            'CLEAR ,,' + n,
            'FOR I=0 TO ' + ( n - 1 ),
            'READ A$,B$,C$,D$,E$,F$,G$,H$',
            'DEFGR$(' + ns + '+I)=VAL("&H"+A$),VAL("&H"+B$),VAL("&H"+C$),VAL("&H"+D$),VAL("&H"+E$),VAL("&H"+F$),VAL("&H"+G$),VAL("&H"+H$)',
            'NEXT I'
        ],
        dataBASIC: 'DATA %1,%2,%3,%4,%5,%6,%7,%8',
        endBASIC: undefined
    },

    'c64':
    {
        width: 8,
        height: 8,
        headerBASIC: undefined,
        dataBASIC: undefined,
        endBASIC: undefined
    },

    'vg5000':
    {
        width: 8,
        height: 10,
        headerBASIC: 
        [
            'INIT 1,0',
        ],
        dataBASIC: 'SETET %NS,"%1%2%3%4%5%6%7%8%9%A"',
        endBASIC: ''
    }        
}

loadImage( imgFile ).then( ( image ) =>
{
    imgSource = image;
    canvas = createCanvas( image.width, image.height );
    ctx = canvas.getContext( '2d' );
    ctx.drawImage( image, 0, 0 );

    captureProcess();
    process.exit( 0 );
} );

function showHelp()
{
    console.log( 'Syntax in command line:' );
    console.log( 'img2char.js <imagefile> [-n=<number>] [-c=<color>] [-s=<spacing>] [-m=<machine> ] [-o=<output>]' );
    console.log( ' imagefile: Absolute path of the image file.' );
    console.log( ' -n: The number of characters to capture ( 127 by default ).' );
    console.log( ' -ns: The index of start of first user character ( 32 by default ).' );    
    console.log( ' -c: The color to capture ( #FFFFFF by default ).' );
    console.log( ' -s: Spacing between each character. (0 by default)' );
    console.log( ' -m: Target machine. Must be CPC, VG5000, THOMSON or C64. (CPC by default)' );
    console.log( ' -o: Output path for the generated BASIC file. (directory of the imagefile by default)' );
}

function checkImage()
{
    var img = myArgs[ 0 ];
    if( !FS.existsSync( img ) )
    {
        console.log( 'ERROR: ' + img + ' not found.' );
        process.exit( 1 );
    }

    var ext = PATH.extname( img ).toLowerCase();
    if( ext != '.png' && ext !='.gif' && ext != '.bmp' && ext!= '.jpg' )
    {
        console.log( 'ERROR: ' + img + ' format not supported.' );
        process.exit( 1 );
    }
    return img;
}

function captureProcess()
{
    console.log( 'Convert Image to Characters...' );
    var sx = 0;
    var sy = 0;
    var x = 0;
    var y = 0;
    var chars = [];
    var char = [];
    var line = '';

    while( chars.length < n )
    {    
        var col = ctx.getImageData( sx + x, sy + y, 1, 1 ).data;
        var hex = '#' + rgbToHex( col[ 0 ], col[ 1 ], col[ 2 ] );
        if( hex.toLowerCase() == c.toLowerCase() )
        {
            line += '1';
        }
        else
        {
            line += '0';
        }
        x++;

        if( x == captureSettings[ m ].width )
        {
            char.push( line );
            line = '';
            x = 0;
            y = y + 1;
            if( y == captureSettings[ m ].height )
            {
                chars.push( char );
                char = [];
                y = 0;
                sx = sx + captureSettings[ m ].width + s;
                if( sx > imgSource.width )
                {
                    sx = 0;
                    sy = sy + captureSettings[ m ].height + s;
                    if( sy > imgSource.height )
                    {
                        console.log( 'ERROR: The capture procedure has gone out of bounds image.' );
                        process.exit( 1 );                        
                    }
                } 
            }
        }
    }

    var code = '';
    console.log( "Generating of the BASIC code..." );
    if ( chars && chars.length > 0 && captureSettings[ m ].headerBASIC )
    {
        code = captureSettings[ m ].headerBASIC.join( "\r\n" );
        var nd = [ '%1', '%2', '%3','%4','%5','%6','%7','%8','%9','%A' ];
        var nl = 100;
        for( var ch = 0; ch < chars.length; ch++ )
        {
            var char = chars[ ch ];
            var values = [];

            var lineData = captureSettings[ m ].dataBASIC;
            for ( var l = 0; l < char.length; l++ )
            {
                var hx = parseInt( char[ l ],2 ).toString( 16 ).toUpperCase();
                if( hx.length < 2 )
                {
                    hx = "0" + hx;
                }
                lineData = lineData.strReplace( nd[ l ], hx );
            }
            code = code + "\r\n" + lineData.strReplace( "%NS", "0" + ns );
            nl = nl + 10;
            ns++;
        }
    }

    FS.writeFileSync( o + '/USERCHAR.BAS', code, 'utf8' );
    console.log( 'Code BASIC created in ' + ( o + '/code.BAS' ) );
}

function rgbToHex(r, g, b){
    if ( r > 255 || g > 255 || b > 255 )
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

String.prototype.strReplace = function( strSearch, strReplace )
{
	var newStr = '';
	for( n = 0; n < this.length; n++ )
	{
		var part = this.substr( n, strSearch.length );
		if( part == strSearch )
		{
			newStr = newStr + strReplace;
			n = n + ( strSearch.length - 1 );
		}
		else
		{
			newStr = newStr + part.substr( 0, 1 );
		}
	}

	return newStr;
}