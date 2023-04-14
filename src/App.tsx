import './App.css';
import Generator from './generator/Generator';
import { Container, AppShell, Navbar, Header, Title, Center, Text } from '@mantine/core';
import Sidebar from './sidebar/Sidebar';
import { useState } from "react"
import { Character, getEmptyCharacter } from "./data/Character"
function App() {
  const [character, setCharacter] = useState<Character>(getEmptyCharacter())

  return (
    <AppShell
      padding="md"
      navbar={<Navbar width={{ base: 300 }} height={"100%"} p="xs">{<Sidebar character={character} />}</Navbar>}
      header={<Header height={60} p="xs"><Center><Title>VtM v5 Character Generator </Title><Text c="dimmed">&nbsp; by Odin</Text></Center></Header>}
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
