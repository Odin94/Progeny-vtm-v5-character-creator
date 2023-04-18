import { AppShell, Container, Header, Navbar } from '@mantine/core';
import { useState } from "react";
import './App.css';
import { Character, getEmptyCharacter } from "./data/Character";
import Generator from './generator/Generator';
import Sidebar from './sidebar/Sidebar';
import Topbar from './topbar/Topbar';
import { useMediaQuery } from '@mantine/hooks';

function App() {
  const phoneSizedScreen = useMediaQuery('(max-width: 550px)');
  const [character, setCharacter] = useState<Character>(getEmptyCharacter())

  return (
    <AppShell
      padding="md"
      navbar={phoneSizedScreen ? <></> : <Navbar width={{ base: 300 }} height={"100%"} p="xs">{<Sidebar character={character} />}</Navbar>}
      header={<Header height={60} p="xs"><Topbar character={character} setCharacter={setCharacter} /></Header>}
      styles={(theme) => ({
        main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
      })}
    >
      {
        <Container>
          <Generator character={character} setCharacter={setCharacter} />
        </Container >
      }
    </AppShell>
  );
}

export default App;
