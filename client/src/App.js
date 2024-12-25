import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, InputGroup, FormControl, Button, Row, Card, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;

function formatDate(inputDate) {
  const date = new Date(inputDate);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function ArtistInfo(props) {
  if (props.artist.length !== 0) {
    let genreString = "";
    if (props.artist.genres.length !== 0) {
      if (props.artist.genres.length === 1) {
        // fix for one-letter bug when genre length is 1
        genreString = ", commonly associated with " + props.artist.genres[0];
      } else {
        let genres = props.artist.genres.join(', ');
        let lastCommaIdx = genres.lastIndexOf(',');
        let splitGenres = genres.slice(lastCommaIdx);
        splitGenres = splitGenres.replace(", ", " and ");
        genres = genres.substring(0, lastCommaIdx);
        genres = genres + splitGenres;
        genreString = ", commonly associated with " + genres;
      }
    }
    
    let albumPlurality = props.albums.length === 1 ? "album" : "albums";
    let artistPopularity = props.artist.popularity + "%";
    let artistImgUrl = props.artist.images[0].url;

    return (
      <div className='ArtistInfo'>
        <Container style={{width: "100%"}}>
          <Row className="row-cols-2">
            <Col className='col-9'>
              <div className='ArtistInfoText'>
                <h1 style={{color: '#82401d'}}>{props.artist.name}</h1>
                <p>{props.artist.followers.total.toLocaleString() + " followers"}</p>
                <p>{props.artist.name} has released {props.albums.length} {albumPlurality}{genreString}.</p>
                <br />
                <p>Popularity</p>
                <div id="artistPopularity">
                  <div id="popularityBar" style={{width: artistPopularity}}></div>
                </div>
              </div>
            </Col>
            <Col className='col-3'>
              <img className='artistPic' src={artistImgUrl} title={props.artist.name} alt={props.artist.name} style={{width:"100%", height:"auto"}}/>
            </Col>
          </Row>
        </Container>
      </div>
    )
  } 
}

function AlbumGrid(props) {
  let discogText = ""
  if (props.albums.length > 0) {
    discogText = "Discography";
  }

  return (
    <div className="AlbumGrid">
      <Container>
        <h2 id="discogText" style={{textAlign: "left", marginLeft: "6px"}}>{discogText}</h2>
        <Row className="row-cols-6 p-2 d-flex justify-content-center">
          { props.albums.map(album => {
            // add code to cutoff long album names
            return (
              <div key={album.id}>
                <Card className="mt-5 mb-1" style={{border: 'none'}}>
                  <Card.Img className="cardImage" src={album.images[0].url} />
                </Card>
                <Card className='mt-1 mb-2' style={{backgroundColor: "#45575b", color: "#e6cab3", height: "200px"}}>
                  <Card.Body>
                    <Card.Title className="albumTitle">{album.name}</Card.Title>
                    <Card.Body style={{position: "absolute", left: "5px", right: "5px", bottom: "70px"}}>
                      {formatDate(album.release_date)}
                    </Card.Body>
                    <Card.Body style={{position: "absolute", left: "5px", right: "5px", bottom: "30px"}}>
                      {album.total_tracks} songs
                    </Card.Body>
                    <Card.Link className="spotifyLink" href={album.external_urls.spotify} target="_blank" rel="noreferrer" 
                    style={{position: "absolute", left: "5px", right: "5px", bottom: "10px", textDecoration: "none"}}>
                      Open on Spotify
                    </Card.Link>
                  </Card.Body>
                </Card>
              </div>
            );
          })}
        </Row>
      </Container>
    </div>
  )
}

let zeroAlbumCheck = (albumCount) => {
  if (albumCount === 0) {
    alert("No albums found for this artist.");
  }
}

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [artist, setArtist] = useState([]);
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    // API Access Token
    var authParams = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET
    };
    fetch('https://accounts.spotify.com/api/token', authParams)
    .then(res => res.json())
    .then(data => setAccessToken(data.access_token));
  }, []);

  async function search() {
    if (searchInput !== "") {
      // GET request search parameters
      let searchParams = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        }
      };

      // GET request to /search to get the Artist ID
      let artistID = await fetch('https://api.spotify.com/v1/search?q=' + searchInput + '&type=artist', searchParams)
      .then(res => res.json())
      .then(data => { 
        setArtist(data.artists.items[0])
        return data.artists.items[0].id 
      });

      // GET request to /artists to grab all albums from the artist
      await fetch('https://api.spotify.com/v1/artists/' + artistID + '/albums?include_groups=album&market=US&limit=50', searchParams)
      .then(res => res.json())
      .then(data => { 
        setAlbums(data.items);
        zeroAlbumCheck(data.items.length);
      });
    } 
    else {
      alert("Please enter something in the box. Anything.");
    }
  }

  return (
    <div className="App">
      <Container style={{marginTop:"3%"}}>
        <InputGroup size="lg" style={{outline:0, width:"40%", marginLeft:"1%"}}>
          <FormControl
            placeholder="Search For Artist..."
            type="input"
            onKeyDown={event => {
              if (event.key === "Enter") {
                search();
                const element = document.getElementById('artistInfoElement');
                element?.scrollIntoView({
                  behavior: 'smooth'
                });
              }
            }}
            onChange={event => setSearchInput(event.target.value)}
            style={{backgroundColor: "#d6c5b6"}}
          />
          <Button onClick={() => {
              search();
              const element = document.getElementById('artistInfoElement');
              element?.scrollIntoView({
                behavior: 'smooth'
              });
            }} 
            className='outline-none'>
            Search
          </Button>
        </InputGroup>
      </Container>
      <div id='artistInfoElement' className='artistInfoElement'>
        <ArtistInfo artist={artist} albums={albums} />
      </div>
      <AlbumGrid albums={albums}/>
    </div>
  );
}

export default App;